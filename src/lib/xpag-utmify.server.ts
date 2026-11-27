import { rechargePackage, type RechargeKey } from "./recharge-packages";
import type { LocalCurrency, LocalMethodId } from "./xpag";

export const XPAG_TRACKING_KEYS = [
  "src",
  "sck",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type XpagTrackingMap = Partial<Record<(typeof XPAG_TRACKING_KEYS)[number] | "utm_id", string>>;

export type XpagUtmifySaleInput = {
  requestNumber: string;
  priceKey: RechargeKey;
  method: LocalMethodId;
  currency: LocalCurrency;
  amount: number;
  fee?: number;
  status: "waiting_payment" | "paid";
  createdAt: string;
  approvedAt?: string | null;
  customerName: string;
  customerEmail: string;
  tracking?: XpagTrackingMap;
};

const COUNTRY_BY_CURRENCY: Record<LocalCurrency, string> = {
  COP: "CO",
  MXN: "MX",
  BRL: "BR",
};

function formatUtmifyDate(iso: string): string {
  const d = new Date(iso);
  const safe = Number.isNaN(d.getTime()) ? new Date() : d;
  return safe.toISOString().replace("T", " ").slice(0, 19);
}

export function sanitizeXpagTracking(raw?: Record<string, string | null | undefined>): XpagTrackingMap {
  const out: XpagTrackingMap = {};
  if (!raw) return out;
  for (const key of [...XPAG_TRACKING_KEYS, "utm_id"] as const) {
    const v = raw[key];
    if (typeof v === "string") {
      const trimmed = v.trim().slice(0, 150);
      if (trimmed) out[key] = trimmed;
    }
  }
  return out;
}

export function buildXpagUtmifyPayload(input: XpagUtmifySaleInput) {
  const pack = rechargePackage(input.priceKey);
  const totalPriceInCents = Math.max(0, Math.round(input.amount * 100));
  const rawFeeCents = typeof input.fee === "number" && Number.isFinite(input.fee) && input.fee > 0
    ? Math.round(input.fee * 100)
    : 0;
  const gatewayFeeInCents = Math.min(totalPriceInCents, rawFeeCents);
  const userCommissionInCents = Math.max(0, totalPriceInCents - gatewayFeeInCents);
  const paymentMethod = input.method === "OXXO" ? "boleto" : "pix";

  const trackingParameters: Record<(typeof XPAG_TRACKING_KEYS)[number], string | null> = {
    src: input.tracking?.src ?? null,
    sck: input.tracking?.sck ?? null,
    utm_source: input.tracking?.utm_source ?? null,
    utm_medium: input.tracking?.utm_medium ?? null,
    utm_campaign: input.tracking?.utm_campaign ?? null,
    utm_content: input.tracking?.utm_content ?? null,
    utm_term: input.tracking?.utm_term ?? null,
  };

  return {
    orderId: input.requestNumber,
    platform: "XPag",
    paymentMethod,
    status: input.status,
    createdAt: formatUtmifyDate(input.createdAt),
    approvedDate: input.status === "paid" ? formatUtmifyDate(input.approvedAt ?? new Date().toISOString()) : null,
    refundedAt: null,
    customer: {
      name: input.customerName || "Cliente",
      email: input.customerEmail,
      phone: null,
      document: null,
      country: COUNTRY_BY_CURRENCY[input.currency],
    },
    products: [
      {
        id: `diamantes-${pack.key}`,
        name: `${pack.diamonds} Diamantes Free Fire`,
        planId: null,
        planName: null,
        quantity: 1,
        priceInCents: totalPriceInCents,
      },
    ],
    trackingParameters,
    commission: {
      totalPriceInCents,
      gatewayFeeInCents,
      userCommissionInCents,
      currency: input.currency,
    },
    isTest: false,
  };
}

export async function sendXpagSaleToUtmify(input: XpagUtmifySaleInput): Promise<boolean> {
  const token = process.env["UTMIFY_API_TOKEN"];
  if (!token) return false;
  try {
    const payload = buildXpagUtmifyPayload(input);
    const res = await fetch("https://api.utmify.com.br/api-credentials/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": token,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6_000),
    });
    if (!res.ok) {
      const errJson = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
      const reason = typeof errJson?.error === "string" ? errJson.error : typeof errJson?.message === "string" ? errJson.message.slice(0, 80) : "unknown";
      console.error(`[UTMIFY-XPAG] Delivery failed (${res.status}, ${reason}) for status=${input.status}`);
      return false;
    }
    return true;
  } catch {
    console.error(`[UTMIFY-XPAG] Delivery error for status=${input.status}`);
    return false;
  }
}