import { rechargePackages } from "./recharge-packages";

export const trackingKeys = ["src", "sck", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id"] as const;

type Intent = {
  id: string; status: string; amount: number; amount_received: number;
  currency: string; created: number; livemode: boolean;
  metadata: Record<string, string>; receipt_email?: string;
  latest_charge?: { created?: number; billing_details?: { name?: string; email?: string; phone?: string; address?: { country?: string } }; balance_transaction?: { fee?: number; currency?: string; exchange_rate?: number | null } };
};

export async function stripeRequest(path: string, secret: string, body?: URLSearchParams) {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
    body, signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Stripe verification failed (${response.status})`);
  return response.json();
}

export function buildPaidSale(intent: Intent) {
  if (intent.status !== "succeeded" || intent.amount_received <= 0 || intent.amount_received !== intent.amount) {
    throw new Error("Payment is not fully paid");
  }
  const metadata = intent.metadata || {};
  const billing = intent.latest_charge?.billing_details;
  const pack = rechargePackages.find((p) => p.key === metadata.price_key?.replace(/^eur_/, ""));
  const date = (seconds: number) => new Date(seconds * 1000).toISOString().replace("T", " ").slice(0, 19);
  // Keep the provider's original order ID and creation date for safe resubmission.
  const settlement = intent.latest_charge?.balance_transaction;
  // Stripe fees are in settlement currency, not necessarily the charge currency.
  // exchange_rate converts charge -> settlement; divide to convert the fee back.
  const sameCurrency = settlement?.currency?.toLowerCase() === intent.currency.toLowerCase();
  const rate = settlement?.exchange_rate;
  const convertedFee = sameCurrency ? (settlement?.fee || 0)
    : rate && rate > 0 ? Math.round((settlement?.fee || 0) / rate) : 0;
  const fee = Math.max(0, Math.min(intent.amount_received, convertedFee));
  return {
    orderId: intent.id, platform: "Stripe", paymentMethod: "credit_card", status: "paid",
    createdAt: date(intent.created), approvedDate: date(intent.latest_charge?.created || intent.created), refundedAt: null,
    customer: {
      name: billing?.name || metadata.customer_name || "Cliente",
      email: billing?.email || intent.receipt_email || metadata.customer_email || "",
      phone: billing?.phone || null, document: null,
      country: billing?.address?.country || metadata.billing_country || undefined,
    },
    products: [{ id: pack ? `diamantes-${pack.key}` : metadata.price_key || intent.id,
      name: pack ? `${pack.diamonds} Diamantes Free Fire` : metadata.product_name || metadata.product || "Diamantes Free Fire",
      planId: null, planName: null, quantity: 1, priceInCents: intent.amount_received }],
    trackingParameters: Object.fromEntries(trackingKeys.filter((key) => key !== "utm_id").map((key) => [key, metadata[`tracking_${key}`] || null])),
    commission: { totalPriceInCents: intent.amount_received, gatewayFeeInCents: fee,
      userCommissionInCents: intent.amount_received - fee, currency: intent.currency.toUpperCase() },
    isTest: !intent.livemode,
  };
}

export async function deliverPaidSale(id: string, stripeSecret: string, token: string, clientSecret?: string) {
  const intent = await stripeRequest(`/payment_intents/${encodeURIComponent(id)}?expand[]=latest_charge.balance_transaction`, stripeSecret);
  if (clientSecret !== undefined && intent.client_secret !== clientSecret) {
    throw new Error("Payment verification denied");
  }
  const payload = buildPaidSale(intent);
  if (intent.metadata?.utmify_paid_sent === "true") return { success: true, alreadySent: true };
  const response = await fetch("https://api.utmify.com.br/api-credentials/orders", {
    method: "POST", headers: { "Content-Type": "application/json", "x-api-token": token },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(10_000),
  });
  // Never log provider bodies: they can echo customer data or credentials.
  if (!response.ok) throw new Error(`Utmify delivery failed (${response.status})`);
  const result = await response.json().catch(() => null);
  if (result?.success === false || result?.error) throw new Error("Utmify rejected the sale");
  await stripeRequest(`/payment_intents/${encodeURIComponent(id)}`, stripeSecret,
    new URLSearchParams({ "metadata[utmify_paid_sent]": "true" }));
  return { success: true, alreadySent: false };
}