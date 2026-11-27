import { test } from "node:test";
import { deepStrictEqual, strictEqual } from "node:assert/strict";
import { buildXpagUtmifyPayload, sanitizeXpagTracking } from "./xpag-utmify.server";

test("builds waiting_payment and paid Utmify payloads with UTMs and COP cents", () => {
  const waiting = buildXpagUtmifyPayload({
    requestNumber: "pr_12345",
    priceKey: "9",
    method: "NEQUI",
    currency: "COP",
    amount: 35413,
    fee: 500,
    status: "waiting_payment",
    createdAt: "2026-11-27T18:30:00.000Z",
    customerName: "Carlos Gomez",
    customerEmail: "carlos@example.com",
    tracking: {
      utm_source: "FB",
      utm_medium: "colombia",
      utm_campaign: "FF_CO_303",
      utm_content: "ad_1",
      utm_term: "feed",
      src: "fb_src",
      sck: "fb_sck",
    },
  });

  strictEqual(waiting.orderId, "pr_12345");
  strictEqual(waiting.platform, "XPag");
  strictEqual(waiting.paymentMethod, "pix");
  strictEqual(waiting.status, "waiting_payment");
  strictEqual(waiting.approvedDate, null);
  strictEqual(waiting.customer.country, "CO");
  strictEqual(waiting.commission.currency, "COP");
  strictEqual(waiting.commission.totalPriceInCents, 3541300);
  strictEqual(waiting.commission.gatewayFeeInCents, 50000);
  strictEqual(waiting.commission.userCommissionInCents, 3491300);
  deepStrictEqual(waiting.trackingParameters, {
    src: "fb_src",
    sck: "fb_sck",
    utm_source: "FB",
    utm_medium: "colombia",
    utm_campaign: "FF_CO_303",
    utm_content: "ad_1",
    utm_term: "feed",
  });

  const paid = buildXpagUtmifyPayload({
    requestNumber: "pr_12345",
    priceKey: "9",
    method: "NEQUI",
    currency: "COP",
    amount: 35413,
    status: "paid",
    createdAt: "2026-11-27T18:30:00.000Z",
    approvedAt: "2026-11-27T18:35:00.000Z",
    customerName: "Carlos Gomez",
    customerEmail: "carlos@example.com",
  });

  strictEqual(paid.status, "paid");
  strictEqual(paid.approvedDate, "2026-11-27 18:35:00");
});

test("sanitizes tracking params by trimming, dropping blanks, and capping length", () => {
  const clean = sanitizeXpagTracking({
    utm_source: "  tiktok  ",
    utm_medium: "   ",
    utm_campaign: "x".repeat(200),
    src: null,
  });
  strictEqual(clean.utm_source, "tiktok");
  strictEqual(clean.utm_medium, undefined);
  strictEqual(clean.utm_campaign?.length, 150);
  strictEqual(clean.src, undefined);
});