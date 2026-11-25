import { rechargePackage, type RechargeKey } from "./recharge-packages";
import {
  LOCAL_METHODS,
  getLocalMethod,
  roundForCurrency,
  type LocalCheckoutOptions,
  type LocalCurrency,
  type LocalMethodId,
  type MethodQuote,
  type XpagChargeInstruction,
} from "./xpag";

const XPAG_GATEWAY_BASE = "https://connector-gateway.lovable.dev/udc_xpag";
const RATE_CACHE_TTL_MS = 60 * 60 * 1000;
const FALLBACK_RATES: Record<LocalCurrency, number> = {
  MXN: 20.1,
  COP: 4320,
  BRL: 5.8,
};

let cachedRates: { expiresAt: number; rates: Record<LocalCurrency, number>; live: boolean } | undefined;

function getGatewayHeaders(): Record<string, string> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const xpagKey = process.env["UDC_XPAG_API_KEY"];
  if (!lovableKey || !xpagKey) {
    throw new Error("A conexão com a XPag não está configurada neste ambiente.");
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
    const providerMsg = typeof json?.["error"] === "string" ? json["error"] : text.slice(0, 200);
    console.error(`XPag error [${res.status}] (${errorCode}): ${providerMsg}`);
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
      return "Credenciais da XPag inválidas. Reconecte sua conta XPag com o Client ID e Client Secret corretos.";
    case "key_inactive":
    case "permission_denied":
      return "Sua chave da XPag não tem permissão ativa para criar cobranças.";
    case "currency_not_enabled":
      return "Esta moeda não está habilitada na sua conta XPag. Escolha outro método de pagamento.";
    case "amount_below_min":
      return "O valor deste pacote está abaixo do mínimo aceito para este método.";
    case "amount_above_limit":
      return "O valor deste pacote ultrapassa o limite aceito para este método.";
    case "provider_unavailable":
    case "maintenance":
      return "O provedor deste método está temporariamente indisponível. Tente novamente em instantes.";
    case "rate_limited":
      return "Muitas tentativas em sequência. Aguarde alguns segundos e tente novamente.";
    default:
      return fallback || "Não foi possível gerar a cobrança agora. Tente novamente.";
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
    const data = (await res.json()) as { result?: string; rates?: Record<string, number> };
    const mxn = data.rates?.["MXN"];
    const cop = data.rates?.["COP"];
    const brl = data.rates?.["BRL"];
    if (data.result === "success" && mxn && cop && brl) {
      const rates: Record<LocalCurrency, number> = { MXN: mxn, COP: cop, BRL: brl };
      cachedRates = { expiresAt: Date.now() + RATE_CACHE_TTL_MS, rates, live: true };
      return { rates, live: true };
    }
  } catch {
    // Safe fallback rates if the external FX API is unreachable
  }
  return { rates: FALLBACK_RATES, live: false };
}

async function fetchEnabledCurrencies(): Promise<LocalCurrency[] | null> {
  try {
    const data = await callXpag("/balance", { method: "GET" });
    const balances = data["balances"] as Record<string, unknown> | undefined;
    if (!balances || typeof balances !== "object") return null;
    const supported: LocalCurrency[] = ["MXN", "COP", "BRL"];
    const active = supported.filter((c) => Object.prototype.hasOwnProperty.call(balances, c));
    return active.length > 0 ? active : null;
  } catch {
    return null;
  }
}

export async function getLocalCheckoutOptionsServer(priceKey: RechargeKey): Promise<LocalCheckoutOptions> {
  const pack = rechargePackage(priceKey);
  const [{ rates, live }, enabledCurrencies] = await Promise.all([
    fetchLocalRates(),
    fetchEnabledCurrencies(),
  ]);

  const quotes = {} as Record<LocalMethodId, MethodQuote>;
  for (const method of LOCAL_METHODS) {
    const rate = rates[method.currency];
    quotes[method.id] = {
      method: method.id,
      currency: method.currency,
      amount: roundForCurrency(pack.priceUsd, rate, method.currency),
      rateFromUsd: rate,
    };
  }

  return {
    priceKey,
    priceUsd: pack.priceUsd,
    productTitle: `${pack.diamonds} Diamantes`,
    productSubtitle: `+ ${pack.bonus} Bônus · Free Fire`,
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
}): Promise<XpagChargeInstruction> {
  const pack = rechargePackage(input.priceKey);
  const meta = getLocalMethod(input.method);
  const { rates } = await fetchLocalRates();
  const amount = roundForCurrency(pack.priceUsd, rates[meta.currency], meta.currency);

  if (meta.minAmount !== undefined && amount < meta.minAmount) {
    throw new Error(`O valor mínimo para ${meta.label} é ${meta.minAmount} ${meta.currency}.`);
  }
  if (meta.maxAmount !== undefined && amount > meta.maxAmount) {
    throw new Error(`O valor máximo para ${meta.label} é ${meta.maxAmount} ${meta.currency}.`);
  }

  const externalId = `loc_${input.priceKey}_${input.method.toLowerCase()}_${Date.now()}`;
  const description = `${pack.statement} - ${pack.diamonds} Diamantes`;

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
  return parseXpagInstruction(raw, {
    method: input.method,
    currency: meta.currency,
    amount,
    externalId,
  });
}

export async function consultXpagChargeServer(input: {
  requestNumber: string;
  method: LocalMethodId;
  currency: LocalCurrency;
  amount: number;
  externalId: string;
}): Promise<XpagChargeInstruction> {
  const query = new URLSearchParams({ request_number: input.requestNumber });
  const raw = await callXpag(`/consult-transaction?${query.toString()}`, { method: "GET" });
  return parseXpagInstruction(raw, {
    method: input.method,
    currency: input.currency,
    amount: input.amount,
    externalId: input.externalId,
  });
}