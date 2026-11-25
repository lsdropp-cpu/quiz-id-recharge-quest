import { rechargePackage, type RechargeKey } from "./recharge-packages";
import { signXpagProof, verifyXpagProof } from './xpag-proof.server';
import {
  LOCAL_METHODS,
  getLocalMethod,
  roundForCurrency,
  xpagProductDescription,
  type LocalCheckoutOptions,
  type LocalCurrency,
  type LocalMethodId,
  type MethodQuote,
  type XpagChargeInstruction,
} from "./xpag";

const XPAG_GATEWAY_BASE = "https://connector-gateway.lovable.dev/udc_xpag";
const RATE_CACHE_TTL_MS = 60 * 60 * 1000;
const QUOTE_TTL_MS = 30 * 60_000;
function signingSecret() {
  const secret = process.env['LOCAL_CHECKOUT_SIGNING_SECRET'];
  if (!secret) throw new Error('Configuración de pagos no disponible.');
  return secret;
}

let cachedRates: { expiresAt: number; rates: Record<LocalCurrency, number>; live: boolean } | undefined;

function getGatewayHeaders(): Record<string, string> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const xpagKey = process.env["UDC_XPAG_API_KEY"];
  if (!lovableKey || !xpagKey) {
    throw new Error("La conexión con XPag no está configurada en este entorno.");
  }
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": xpagKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function callXpag(path: string, init: { method?: "GET" | "POST"; body?: Record<string, unknown> } = {}) {
  const headers = getGatewayHeaders();
  const res = await fetch(`${XPAG_GATEWAY_BASE}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  let json: Record<string, unknown> | null = null;
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : null;
  } catch {
    json = null;
  }
  if (!res.ok || (json && json["ok"] === false)) {
    const errorCode = typeof json?.["error_code"] === "string" ? json["error_code"] : `http_${res.status}`;
    const providerMsg = typeof json?.["error"] === "string" ? json["error"] : 'Error al consultar XPag.';
    console.error(`XPag error [${res.status}] (${errorCode})`);
    const err = new Error(mapXpagError(errorCode, providerMsg));
    (err as Error & { code?: string }).code = errorCode;
    throw err;
  }
  return json ?? {};
}

function mapXpagError(code: string, fallback: string): string {
  switch (code) {
    case "invalid_credentials":
    case "missing_credentials":
      return "Credenciales de XPag inválidas. Reconecta tu cuenta de XPag con el Client ID y Client Secret correctos.";
    case "key_inactive":
    case "permission_denied":
      return "Tu clave de XPag no tiene permiso activo para crear cobros.";
    case "currency_not_enabled":
      return "Esta moneda no está habilitada en la cuenta de XPag. Elige otro método de pago.";
    case "amount_below_min":
      return "El monto de este paquete está por debajo del mínimo aceptado para este método.";
    case "amount_above_limit":
      return "El monto de este paquete supera el límite aceptado para este método.";
    case "provider_unavailable":
    case "maintenance":
      return "El proveedor de este método no está disponible temporalmente. Inténtalo de nuevo en unos momentos.";
    case "rate_limited":
      return "Demasiados intentos seguidos. Espera unos segundos e inténtalo de nuevo.";
    default:
      return fallback || "No se pudo generar el cobro en este momento. Inténtalo de nuevo.";
  }
}

export async function fetchLocalRates(): Promise<{ rates: Record<LocalCurrency, number>; live: boolean }> {
  if (cachedRates && cachedRates.expiresAt > Date.now()) {
    return { rates: cachedRates.rates, live: cachedRates.live };
  }
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error("Rates HTTP error");
    const data = (await res.json()) as { result?: string; rates?: Record<string, number>; time_last_update_unix?: number };
    const mxn = data.rates?.["MXN"];
    const cop = data.rates?.["COP"];
    const brl = data.rates?.["BRL"];
    if (data.result === "success" && mxn && cop && brl && [mxn, cop, brl].every(r => Number.isFinite(r) && r > 0) && data.time_last_update_unix && Date.now()/1000 - data.time_last_update_unix < 172800) {
      const rates: Record<LocalCurrency, number> = { MXN: mxn, COP: cop, BRL: brl };
      cachedRates = { expiresAt: Date.now() + RATE_CACHE_TTL_MS, rates, live: true };
      return { rates, live: true };
    }
  } catch {
    // Fail closed: never charge using invented exchange rates.
  }
  throw new Error('No se pudo actualizar el tipo de cambio. Inténtalo de nuevo.');
}

async function fetchEnabledCurrencies(): Promise<LocalCurrency[] | null> {
  try {
    const data = await callXpag("/balance", { method: "GET" });
    const balances = data["balances"] as Record<string, unknown> | undefined;
    if (!balances || typeof balances !== "object") throw new Error('Monedas no disponibles.');
    const supported: LocalCurrency[] = ["MXN", "COP", "BRL"];
    const active = supported.filter((c) => Object.prototype.hasOwnProperty.call(balances, c));
    return active;
  } catch (error) {
    throw error;
  }
}

export async function getLocalCheckoutOptionsServer(priceKey: RechargeKey): Promise<LocalCheckoutOptions> {
  const pack = rechargePackage(priceKey);
  const [{ rates, live }, enabledCurrencies] = await Promise.all([
    fetchLocalRates(),
    fetchEnabledCurrencies(),
  ]);

  const quotes = {} as Record<LocalMethodId, MethodQuote>;
  const expiresAt = Date.now() + QUOTE_TTL_MS;
  for (const method of LOCAL_METHODS) {
    const rate = rates[method.currency];
    const amount = roundForCurrency(pack.priceUsd, rate, method.currency);
    quotes[method.id] = {
      method: method.id,
      currency: method.currency,
      amount,
      rateFromUsd: rate,
      expiresAt,
      token: signXpagProof({ kind: 'quote', priceKey, method: method.id, currency: method.currency, amount, expiresAt }, signingSecret()),
    };
  }

  return {
    priceKey,
    priceUsd: pack.priceUsd,
    productTitle: `${pack.diamonds} Diamantes`,
    productSubtitle: `+ ${pack.bonus} Bono · Free Fire`,
    quotes,
    enabledCurrencies,
    ratesLive: live,
  };
}

function parseXpagInstruction(
  raw: Record<string, unknown>,
  fallback: { method: LocalMethodId; currency: LocalCurrency; amount: number; externalId: string },
): XpagChargeInstruction {
  const payee = (raw["payee_data"] && typeof raw["payee_data"] === "object"
    ? raw["payee_data"]
    : {}) as Record<string, unknown>;

  const str = (...vals: unknown[]): string | undefined => {
    for (const v of vals) {
      if (typeof v === "string" && v.trim().length > 0) return v.trim();
    }
    return undefined;
  };

  const copyPaste = str(raw["copyPaste"], raw["copy_paste"], raw["code"], payee["qr"]);
  const qrImageUrl = str(raw["qr_img"], raw["qr_url"]);
  const reference = str(payee["reference"], raw["reference"]);
  const barcodeUrl = str(payee["barcode"], raw["barcode"]);
  const clabe = str(raw["clabe"], payee["accountNumber"], payee["clabe"]);
  const brebKey = str(raw["breb_key"], payee["key"]);
  const bankName = str(raw["bank_name"], payee["bankName"]);
  const beneficiary = str(raw["beneficiary"], payee["name"]);
  const checkoutUrl = str(raw["checkout_url"], payee["redirectUrl"]);
  const requestNumber = str(raw["request_number"], raw["transaction_id"]) ?? fallback.externalId;
  const transactionId = str(raw["transaction_id"], raw["request_number"]) ?? requestNumber;
  const status = str(raw["status"]) ?? "pending";
  const transferType = str(raw["transfer_type"], payee["transferType"]) ?? "";
  const expireMinutes = typeof raw["expire_minutes"] === "number" ? raw["expire_minutes"] : undefined;
  const rawAmount = typeof raw["amount"] === "number" && raw["amount"] > 0 ? raw["amount"] : fallback.amount;

  const result: XpagChargeInstruction = {
    requestNumber,
    transactionId,
    externalId: fallback.externalId,
    method: fallback.method,
    currency: fallback.currency,
    amount: rawAmount,
    status,
    awaitingInstruction: Boolean(raw["awaiting_instruction"]),
    transferType,
    statusToken: '',
  };
  if (reference) result.reference = reference;
  if (barcodeUrl) result.barcodeUrl = barcodeUrl;
  if (clabe) result.clabe = clabe;
  if (qrImageUrl) result.qrImageUrl = qrImageUrl;
  if (copyPaste) result.copyPaste = copyPaste;
  if (brebKey) result.brebKey = brebKey;
  if (bankName) result.bankName = bankName;
  if (beneficiary) result.beneficiary = beneficiary;
  if (checkoutUrl) result.checkoutUrl = checkoutUrl;
  if (expireMinutes !== undefined) result.expireMinutes = expireMinutes;
  return result;
}

export async function createXpagChargeServer(input: {
  priceKey: RechargeKey;
  method: LocalMethodId;
  name: string;
  email: string;
  quoteToken: string;
}): Promise<XpagChargeInstruction> {
  rechargePackage(input.priceKey);
  const meta = getLocalMethod(input.method);
  const quote = verifyXpagProof(input.quoteToken, 'quote', signingSecret());
  if (quote.priceKey !== input.priceKey || quote.method !== input.method || quote.currency !== meta.currency) throw new Error('Cotización inválida.');
  const amount = quote.amount;
  const enabled = await fetchEnabledCurrencies();
  if (meta.disabled || !enabled?.includes(meta.currency)) {
    throw new Error('Método no disponible en esta cuenta de XPag.');
  }

  if (meta.minAmount !== undefined && amount < meta.minAmount) {
    throw new Error(`El monto mínimo para ${meta.label} es ${meta.minAmount} ${meta.currency}.`);
  }
  if (meta.maxAmount !== undefined && amount > meta.maxAmount) {
    throw new Error(`El monto máximo para ${meta.label} es ${meta.maxAmount} ${meta.currency}.`);
  }

  const externalId = `loc_${crypto.randomUUID()}`;
  const description = xpagProductDescription();

  let body: Record<string, unknown>;
  switch (input.method) {
    case "OXXO":
      body = {
        currency: "MXN",
        method: "OXXO",
        amount,
        payerData: { name: input.name, email: input.email },
        generateCheckout: false,
        description,
        external_id: externalId,
      };
      break;
    case "SPEI":
      body = {
        currency: "MXN",
        amount,
        name: input.name,
        description,
        external_id: externalId,
      };
      break;
    case "NEQUI":
      body = {
        currency: "COP",
        method: "NEQUI",
        amount,
        generateCheckout: false,
        description,
        external_id: externalId,
      };
      break;
    case "BREB":
      body = {
        currency: "COP",
        method: "BREB",
        amount,
        generateCheckout: false,
        description,
        external_id: externalId,
      };
      break;
    case "PIX":
      body = {
        currency: "BRL",
        amount,
        name: input.name,
        description,
        external_id: externalId,
      };
      break;
  }

  const raw = await callXpag("/cashin", { method: "POST", body });
  if (typeof raw['request_number'] !== 'string' && typeof raw['transaction_id'] !== 'string') throw new Error('XPag no devolvió la referencia del pago.');
  if (typeof raw['amount'] === 'number' && Math.abs(raw['amount'] - amount) > 0.001) throw new Error('El monto del cobro no coincide con la cotización.');
  const charge = parseXpagInstruction(raw, {
    method: input.method,
    currency: meta.currency,
    amount,
    externalId,
  });
  charge.statusToken = signXpagProof({ ...quote, kind: 'charge', expiresAt: Date.now() + 13 * 24 * 60 * 60_000, requestNumber: charge.requestNumber, externalId }, signingSecret());
  return charge;
}

export async function consultXpagChargeServer(input: { statusToken: string }): Promise<XpagChargeInstruction> {
  const proof = verifyXpagProof(input.statusToken, 'charge', signingSecret());
  if (!proof.requestNumber || !proof.externalId) throw new Error('Pago inválido.');
  const query = new URLSearchParams({ request_number: proof.requestNumber });
  const raw = await callXpag(`/consult-transaction?${query.toString()}`, { method: "GET" });
  if (raw['type'] && raw['type'] !== 'cashin') throw new Error('Pago inválido.');
  if (raw['currency'] && raw['currency'] !== proof.currency) throw new Error('Moneda inválida.');
  if (typeof raw['amount'] === 'number' && Math.abs(raw['amount'] - proof.amount) > 0.001) throw new Error('Monto inválido.');
  const charge = parseXpagInstruction(raw, {
    method: proof.method,
    currency: proof.currency,
    amount: proof.amount,
    externalId: proof.externalId,
  });
  charge.requestNumber = proof.requestNumber;
  charge.statusToken = input.statusToken;
  return charge;
}