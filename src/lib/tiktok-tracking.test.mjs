import { test, expect } from "bun:test";
import { advertisingAllowed, createConsent, isApprovedPurchase, requiresConsent, TIKTOK_PIXEL_ID, UTMIFY_TIKTOK_PIXEL_ID } from "./tiktok-tracking";
test("uses the user's TikTok pixel", () => { expect(TIKTOK_PIXEL_ID).toBe("DBD5O1BC77U29DFSUJ7G"); });
test("uses the Utmify TikTok pixel id", () => { expect(UTMIFY_TIKTOK_PIXEL_ID).toBe("6a6bd4f5b9b8fc887e72d81a"); });
test("regional notice blocks France until acceptance and fails closed for unknown regions", () => {
  expect(requiresConsent("FR")).toBe(true);
  expect(advertisingAllowed("FR", null, false)).toBe(false);
  for (const region of [null, "XX", "T1", "ZZ"]) expect(advertisingAllowed(region, null, false)).toBe(false);
  expect(advertisingAllowed("BR", null, false)).toBe(true);
});
test("refusal and applicable opt outs override geographic defaults", () => {
  const record = createConsent(null, false, "BR", "visitor-test", "2026-10-21T00:00:00Z");
  expect(advertisingAllowed("BR", record, false)).toBe(false);
  expect(advertisingAllowed("BR", { ...record, advertising: true }, true)).toBe(false);
  expect(advertisingAllowed("FR", { ...record, advertising: true }, false)).toBe(true);
});
test("withdrawal preserves original acceptance evidence", () => {
  const acceptance = createConsent(null, true, "FR", "visitor-test", "2026-10-21T00:00:00Z");
  const withdrawal = createConsent(acceptance, false, "FR", "visitor-test", "2026-10-21T01:00:00Z");
  expect(withdrawal.advertising).toBe(false);
  expect(withdrawal.previousAcceptance?.recordedAt).toBe("2026-10-21T00:00:00Z");
});
test("only approved purchases with real value qualify", () => {
  const purchase = { id: "pi_test", status: "succeeded", amount: 9.9, currency: "USD", productId: "diamantes-9" };
  expect(isApprovedPurchase(purchase)).toBe(true);
  for (const status of ["pending", "failed", "requires_action"]) expect(isApprovedPurchase({ ...purchase, status })).toBe(false);
  expect(isApprovedPurchase({ ...purchase, amount: 0 })).toBe(false);
});