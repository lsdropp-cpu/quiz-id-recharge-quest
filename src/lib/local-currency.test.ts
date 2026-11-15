import { test } from "node:test";
import { deepStrictEqual, strictEqual, rejects } from "node:assert/strict";
import { currencyForCountry, convertPackage, quoteLifetimeMs, rateCacheLifetimeMs, resolveCheckoutCountry } from "./local-currency";
import { createLocalQuote, verifyLocalQuote } from "./local-currency.server";

test("Spanish-speaking markets use their local currencies", () => {
  for (const [country, currency] of Object.entries({ MX: "MXN", CO: "COP", AR: "ARS", CL: "CLP", PE: "PEN", GT: "GTQ", HN: "HNL", NI: "NIO", CR: "CRC", DO: "DOP", ES: "EUR", EC: "USD", SV: "USD", PA: "USD" })) strictEqual(currencyForCountry(country), currency);
});
test("converts the USD 9.90 package without changing its value", () => {
  deepStrictEqual(convertPackage("9", "MXN", 20), { amount: 19800, currency: "MXN", priceAmount: 198, description: "NMJ 5600" });
});
test("Chile uses whole peso units for Stripe", () => {
  strictEqual(convertPackage("9", "CLP", 950).amount, 9405);
});
test("Paraguay uses whole guarani units for Stripe", () => {
  strictEqual(convertPackage("9", "PYG", 7000).amount, 69300);
});
test("ISK Stripe amount is divisible by 100", () => {
  strictEqual(convertPackage("9", "ISK", 137.33).amount, 136000);
});
test("quotes last 30 minutes and rate cache lasts one hour", () => {
  strictEqual(quoteLifetimeMs, 1800000);
  strictEqual(rateCacheLifetimeMs, 3600000);
});
test("manual country wins then access location then timezone then US", () => {
  strictEqual(resolveCheckoutCountry("BR", "MX", "GT"), "BR");
  strictEqual(resolveCheckoutCountry(undefined, "MX", "GT"), "MX");
  strictEqual(resolveCheckoutCountry(undefined, "CN", "GT"), "GT");
  strictEqual(resolveCheckoutCountry("CA", "JP", "IN"), "US");
});
test("all six package base values remain aligned", () => {
  deepStrictEqual(["9", "15", "19", "25", "29", "35"].map((key) => convertPackage(key as "9", "USD", 1).amount), [990, 1590, 1990, 2500, 2990, 3500]);
});
test("server quotes are account-checked, signed, and cannot be altered", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    const data = url.endsWith("/account") ? { country: "US", charges_enabled: true }
      : url.includes("country_specs") ? { supported_payment_currencies: ["usd", "mxn", "eur", "clp", "pyg"] }
      : { result: "success", time_last_update_unix: Date.now() / 1000, rates: { USD: 1, MXN: 20, EUR: 0.9, CLP: 950, PYG: 7000 } };
    return Response.json(data);
  }) as typeof fetch;
  try {
    const quote = await createLocalQuote("9", "MX", "unit-test-signing-value");
    strictEqual(quote.amount, 19800);
    strictEqual(quote.currency, "MXN");
    strictEqual((await verifyLocalQuote(quote.token, "9", "unit-test-signing-value")).amount, 19800);
    await rejects(verifyLocalQuote(quote.token, "15", "unit-test-signing-value"));
    await rejects(verifyLocalQuote(quote.token, "9", "wrong-signing-value"));
    const [payload, signature] = quote.token.split(".");
    const tampered = btoa(JSON.stringify({ ...JSON.parse(atob(payload || "")), amount: 1 }));
    await rejects(verifyLocalQuote(`${tampered}.${signature}`, "9", "unit-test-signing-value"));
    const now = Date.now;
    try {
      Date.now = () => quote.expiresAt + 1;
      await rejects(verifyLocalQuote(quote.token, "9", "unit-test-signing-value"));
    } finally { Date.now = now; }
    const fallback = await createLocalQuote("9", "GT", "unit-test-signing-value");
    strictEqual(fallback.currency, "USD");
    strictEqual(fallback.fallback, true);
  } finally { globalThis.fetch = originalFetch; }
});