import { test, expect } from "bun:test";
import { captureTracking, getStoredTracking, shopifyTrackingUrl } from "./tracking";

test("preserves the requested TikTok campaign id after navigation", () => {
  const entries = new Map();
  const previous = globalThis.window;
  globalThis.window = { sessionStorage: { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) } };
  try {
    captureTracking("utm_source=tiktok&utm_id=campaign-123");
    expect(captureTracking("").utm_id).toBe("campaign-123");
    expect(getStoredTracking().utm_source).toBe("tiktok");
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});

test("Shopify receives all six requested campaign fields as order attributes", () => {
  const tracking = { utm_source: "tiktok", utm_campaign: "Campaign|123", utm_medium: "Group|456", utm_content: "Ad|789", utm_term: "placement", utm_id: "123" };
  const url = new URL(shopifyTrackingUrl("https://qqs5hg-h4.myshopify.com/cart/49462223175777:1?channel=buy_button", tracking));
  for (const [key, value] of Object.entries(tracking)) {
    expect(url.searchParams.get(key)).toBe(value);
    expect(url.searchParams.get(`attributes[${key}]`)).toBe(value);
  }
  expect(url.pathname).toBe("/cart/49462223175777:1");
  expect(url.searchParams.get("channel")).toBe("buy_button");
});