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
    helperText: "Você verá um código de barras para pagar em dinheiro em qualquer loja OXXO.",
    instructions: [
      "Vá a qualquer loja OXXO.",
      "Mostre o código de barras ou a referência no caixa.",
      "Pague em dinheiro o valor exato e guarde o comprovante.",
    ],
    minAmount: 10,
    maxAmount: 10000,
  },
  {
    id: "SPEI",
    label: "SPEI",
    currency: "MXN",
    countryLabel: "México",
    helperText: "Você receberá uma CLABE exclusiva para transferir direto do seu banco mexicano.",
    instructions: [
      "Abra o aplicativo do seu banco e escolha transferir por SPEI.",
      "Cole a CLABE informada acima e confira o banco e o beneficiário.",
      "Transfira o valor exato para confirmação automática.",
    ],
  },
  {
    id: "NEQUI",
    label: "Nequi",
    currency: "COP",
    countryLabel: "Colômbia",
    helperText: "Você verá um QR Code e um código copia e cola para pagar pelo app Nequi.",
    instructions: [
      "Abra o aplicativo Nequi.",
      "Escolha pagar com QR e leia o código acima, ou cole o código copiado.",
      "Confira o valor e conclua o pagamento.",
    ],
  },
  {
    id: "BREB",
    label: "Bre-B",
    currency: "COP",
    countryLabel: "Colômbia",
    helperText: "Você verá um QR Code e a chave curta Bre-B para pagar pelo seu banco na Colômbia.",
    instructions: [
      "Abra o aplicativo do seu banco na Colômbia e entre em Bre-B.",
      "Leia o QR Code acima ou cole a chave Bre-B.",
      "Confira o valor e conclua o pagamento.",
    ],
  },
  {
    id: "PIX",
    label: "Pix",
    currency: "BRL",
    countryLabel: "Brasil",
    disabled: true,
    helperText: "Você verá um QR Code Pix e um código copia e cola com aprovação imediata.",
    instructions: [
      "Abra o aplicativo do seu banco e entre na área Pix.",
      "Leia o QR Code acima ou use o Pix Copia e Cola.",
      "Confira o valor e confirme o pagamento.",
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
    .min(3, "Informe seu nome completo.")
    .max(120, "Nome muito longo."),
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .max(255, "E-mail muito longo."),
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

export function xpagProductDescription(diamonds: string): string {
  return `${XPAG_PRODUCT_NAME} - ${diamonds} Diamantes`;
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