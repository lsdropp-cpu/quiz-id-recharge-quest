import { test, expect } from "bun:test";
import { buildPaidSale, deliverPaidSale } from "./utmify-sales.server";

const intent = { id: "pi_example", status: "succeeded", amount: 3500, amount_received: 3500, currency: "usd", created: 1794000000, livemode: true,
  metadata: { price_key: "35", tracking_utm_source: "tiktok", tracking_utm_campaign: "campaign" },
  latest_charge: { created: 1794000030, billing_details: { name: "Example", email: "example@example.com", address: { country: "GT" } }, balance_transaction: { fee: 150, currency: "usd" } },
};

test("reports the confirmed $35 sale, actual country and campaign", () => {
  const payload = buildPaidSale(intent);
  expect(payload.commission).toEqual({ totalPriceInCents: 3500, gatewayFeeInCents: 150, userCommissionInCents: 3350, currency: "USD" });
  expect(payload.customer.country).toBe("GT");
  expect(payload.trackingParameters.utm_source).toBe("tiktok");
  expect(payload.products[0].priceInCents).toBe(3500);
  expect(payload.orderId).toBe("pi_example");
});
test("never reports an unpaid or partially paid intent", () => {
  for (const status of ["requires_action", "requires_payment_method", "processing", "canceled"]) {
    expect(() => buildPaidSale({ ...intent, status })).toThrow();
  }
  expect(() => buildPaidSale({ ...intent, amount_received: 100 })).toThrow();
});
test("test payments cannot be represented as live sales", () => {
  expect(buildPaidSale({ ...intent, livemode: false }).isTest).toBe(true);
});
test("BRL settlement fees are converted to USD before subtraction", () => {
  const payload = buildPaidSale({ ...intent, amount: 1990, amount_received: 1990,
    latest_charge: { ...intent.latest_charge, balance_transaction: { fee: 695, currency: "brl", exchange_rate: 5.50513 } } });
  expect(payload.commission).toEqual({ totalPriceInCents: 1990, gatewayFeeInCents: 126, userCommissionInCents: 1864, currency: "USD" });
});
test("a foreign fee without an exchange rate is not subtracted as USD", () => {
  const payload = buildPaidSale({ ...intent, latest_charge: { ...intent.latest_charge, balance_transaction: { fee: 695, currency: "brl" } } });
  expect(payload.commission.gatewayFeeInCents).toBe(0);
  expect(payload.commission.userCommissionInCents).toBe(3500);
});
test("a mismatched payment secret cannot register a sale", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ ...intent, client_secret: "expected" }); };
  try {
    await expect(deliverPaidSale("pi_example", "test-placeholder", "test-placeholder", "wrong")).rejects.toThrow("denied");
    expect(calls).toBe(1);
  } finally { globalThis.fetch = original; }
});
test("confirmed deliveries are skipped on resend", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ ...intent, metadata: { ...intent.metadata, utmify_paid_sent: "true" } }); };
  try {
    expect(await deliverPaidSale("pi_example", "test-placeholder", "test-placeholder")).toEqual({ success: true, alreadySent: true });
    expect(calls).toBe(1);
  } finally { globalThis.fetch = original; }
});
test("provider failure is not marked delivered", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return calls === 1 ? Response.json(intent) : new Response("unavailable", { status: 503 }); };
  try {
    await expect(deliverPaidSale("pi_example", "test-placeholder", "test-placeholder")).rejects.toThrow("503");
    expect(calls).toBe(2);
  } finally { globalThis.fetch = original; }
});