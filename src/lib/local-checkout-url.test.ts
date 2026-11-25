import { test } from "node:test";
import { ok, strictEqual } from "node:assert";
import { localCheckoutUrl } from "./local-checkout-url";

test("sends a recharge pack to the /local checkout with the chosen pack", () => {
  const url = localCheckoutUrl("25", "?utm_source=tiktok&utm_campaign=deg");
  strictEqual(url, "/local?p=25&utm_source=tiktok&utm_campaign=deg");
});

test("includes the chosen local payment method in the /local URL and ignores disabled methods", () => {
  strictEqual(
    localCheckoutUrl("19", "?utm_source=tiktok", "NEQUI"),
    "/local?p=19&m=NEQUI&utm_source=tiktok",
  );
  strictEqual(localCheckoutUrl("19", "", "PIX"), "/local?p=19");
});

test("keeps every pack selectable", () => {
  for (const key of ["9", "15", "19", "25", "29", "35"]) {
    const url = localCheckoutUrl(key, "");
    ok(url, `missing url for pack ${key}`);
    ok(url.startsWith(`/local?p=${key}&`) || url === `/local?p=${key}`, `wrong pack in ${url}`);
  }
});

test("never points at Shopify and rejects unknown packs", () => {
  const url = localCheckoutUrl("9", "");
  ok(url && !url.includes("myshopify.com"));
  strictEqual(localCheckoutUrl("42", ""), null);
});
