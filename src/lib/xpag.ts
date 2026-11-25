import { z } from "zod";
import type { RechargeKey } from "./recharge-packages";

export type LocalMethodId = "OXXO" | "SPEI" | "NEQUI" | "BREB" | "PIX";
export type LocalCurrency = "MXN" | "COP" | "BRL";

export type LocalMethodMeta = {
  id: LocalMethodId;
  label: string;
  currency: LocalCurrency;
  countryLabel: string;
  helperText: string;
  instructions: [string, string, string];
  minAmount?: number;
  maxAmount?: number;
  disabled?: boolean;
};

export const LOCAL_METHODS: LocalMethodMeta[] = [
  {
    id: "OXXO",
    label: "OXXO",
    currency: "MXN",
    countryLabel: "México",
    helperText: "Verás un código de barras para pagar en efectivo en cualquier tienda OXXO.",
    instructions: [
      "Ve a cualquier tienda OXXO.",
      "Muestra el código de barras o la referencia en caja.",
      "Paga en efectivo el monto exacto y guarda tu comprobante.",
    ],
    minAmount: 10,
    maxAmount: 10000,
  },
  {
    id: "SPEI",
    label: "SPEI",
    currency: "MXN",
    countryLabel: "México",
    helperText: "Recibirás una CLABE exclusiva para transferir directo desde tu banco en México.",
    instructions: [
      "Abre la app de tu banco y elige transferir por SPEI.",
      "Pega la CLABE indicada arriba y verifica el banco y el beneficiario.",
      "Transfiere el monto exacto para confirmación automática.",
    ],
  },
  {
    id: "NEQUI",
    label: "Nequi",
    currency: "COP",
    countryLabel: "Colombia",
    helperText: "Verás un código QR y un código para copiar y pegar desde la app Nequi.",
    instructions: [
      "Abre la aplicación Nequi.",
      "Elige pagar con QR y escanea el código de arriba, o pega el código copiado.",
      "Verifica el monto y completa el pago.",
    ],
  },
  {
    id: "BREB",
    label: "Bre-B",
    currency: "COP",
    countryLabel: "Colombia",
    helperText: "Verás un código QR y la llave Bre-B para pagar desde tu banco en Colombia.",
    instructions: [
      "Abre la app de tu banco en Colombia y entra a Bre-B.",
      "Escanea el código QR de arriba o pega la llave Bre-B.",
      "Verifica el monto y completa el pago.",
    ],
  },
  {
    id: "PIX",
    label: "Pix",
    currency: "BRL",
    countryLabel: "Brasil",
    disabled: true,
    helperText: "Verás un código QR Pix y un código para copiar y pegar con aprobación inmediata.",
    instructions: [
      "Abre la app de tu banco y entra al área Pix.",
      "Escanea el código QR de arriba o usa el código copia y pega.",
      "Verifica el monto y confirma el pago.",
    ],
  },
];

export function getLocalMethod(id: LocalMethodId): LocalMethodMeta {
  const found = LOCAL_METHODS.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown local method: ${id}`);
  return found;
}

export function getOfferedLocalMethods(
  enabledCurrencies: readonly LocalCurrency[] | null | undefined,
): LocalMethodMeta[] {
  if (!enabledCurrencies || enabledCurrencies.length === 0) return [];
  return LOCAL_METHODS.filter((m) => !m.disabled && enabledCurrencies.includes(m.currency));
}

export const localCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Ingresa tu nombre completo.")
    .max(120, "Nombre demasiado largo."),
  email: z
    .string()
    .trim()
    .email("Ingresa un correo electrónico válido.")
    .max(255, "Correo electrónico demasiado largo."),
});

export const createChargeInputSchema = localCustomerSchema.extend({
  priceKey: z.enum(["9", "15", "19", "25", "29", "35"]),
  method: z.enum(["OXXO", "SPEI", "NEQUI", "BREB", "PIX"]),
  quoteToken: z.string().min(1).max(4096),
});

export type MethodQuote = {
  method: LocalMethodId;
  currency: LocalCurrency;
  amount: number;
  rateFromUsd: number;
  token: string;
  expiresAt: number;
};

export type LocalCheckoutOptions = {
  priceKey: RechargeKey;
  priceUsd: number;
  productTitle: string;
  productSubtitle: string;
  quotes: Record<LocalMethodId, MethodQuote>;
  enabledCurrencies: LocalCurrency[] | null;
  ratesLive: boolean;
};

export type XpagChargeInstruction = {
  requestNumber: string;
  transactionId: string;
  externalId: string;
  method: LocalMethodId;
  currency: LocalCurrency;
  amount: number;
  status: string;
  awaitingInstruction: boolean;
  transferType: string;
  statusToken: string;
  reference?: string;
  barcodeUrl?: string;
  clabe?: string;
  qrImageUrl?: string;
  copyPaste?: string;
  brebKey?: string;
  bankName?: string;
  beneficiary?: string;
  checkoutUrl?: string;
  expireMinutes?: number;
};

const CURRENCY_PREFIX: Record<LocalCurrency, string> = {
  MXN: "MX$",
  COP: "CO$",
  BRL: "R$",
};

export function formatLocalAmount(amount: number, currency: LocalCurrency): string {
  const formatted = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${CURRENCY_PREFIX[currency]} ${formatted}`;
}

// XPag has no separate product-name field: `description` is the text the payer
// sees on the rail, so it carries the product name.
export const XPAG_PRODUCT_NAME = "DEG Guia do Dimas";

export function xpagProductDescription(): string {
  return XPAG_PRODUCT_NAME;
}

export function formatUsdAmount(amount: number): string {
  return `US$ ${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

export function roundForCurrency(usdAmount: number, rate: number, currency: LocalCurrency): number {
  const raw = usdAmount * rate;
  if (currency === "COP") {
    return Math.round(raw);
  }
  return Math.round(raw * 100) / 100;
}