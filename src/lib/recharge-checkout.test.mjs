import { describe, test, expect } from "bun:test";
import { rechargeCheckoutDestinations, rechargeCheckoutSearch } from "./recharge-checkout";

describe("Main recharge uses the Shopify-style Stripe checkout", () => {
  for (const [key, path] of Object.entries({
    "9": "/checkoutt", "15": "/checkoutt15", "19": "/checkoutt19",
    "25": "/checkoutt25", "29": "/checkoutt29", "35": "/checkoutt35",
  })) {
    test(`pack ${key} opens ${path}`, () => {
      expect(rechargeCheckoutDestinations[key]).toBe(path);
    });
  }
  test("campaign attribution survives while stale preview settings do not change the pack", () => {
    expect(rechargeCheckoutSearch("?utm_source=tiktok&utm_id=campaign-123&playerId=123456&p=35&vercarteiras=1")).toEqual({
      utm_source: "tiktok", utm_id: "campaign-123", playerId: "123456",
    });
  });
});