import { convertPackage, currencyForCountry, quoteLifetimeMs, rateCacheLifetimeMs, type LocalQuote } from "./local-currency";
import { billingCountries } from "./checkout-billing";
import type { RechargeKey } from "./recharge-packages";

let cached: { secret: string; expiresAt: number; country: string; currencies: string[]; rates: Record<string, number> } | undefined;
async function signature(payload: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(`local-price-v1:${secret}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
async function readStripe(path: string, secret: string) {
  const response = await fetch(`https://api.stripe.com/v1${path}`, { headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error("Payment currency configuration unavailable");
  return response.json();
}
export async function createLocalQuote(key: RechargeKey, country: string, secret: string): Promise<LocalQuote> {
  if (!billingCountries.some(([code]) => code === country)) throw new Error("Unsupported country");
  if (!cached || cached.secret !== secret || cached.expiresAt <= Date.now()) {
    const account = await readStripe("/account", secret);
    if (!account.country || !account.charges_enabled) throw new Error("Payment account unavailable");
    const spec = await readStripe(`/country_specs/${account.country}`, secret);
    let rates: Record<string, number> = { USD: 1 };
    try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error("Exchange rates unavailable");
    const fx = await response.json();
    if (fx.result !== "success" || !fx.rates || !fx.time_last_update_unix || Date.now() / 1000 - fx.time_last_update_unix > 172800) throw new Error("Exchange rates unavailable");
    rates = fx.rates;
    } catch { /* A verified USD fallback is safe when rates are unavailable. */ }
    cached = { secret, country: account.country, currencies: spec.supported_payment_currencies.map((c: string) => c.toUpperCase()), rates, expiresAt: Date.now() + rateCacheLifetimeMs };
  }
  const wanted = currencyForCountry(country);
  const currency = cached.currencies.includes(wanted) && cached.rates[wanted] > 0 ? wanted : "USD";
  if (!cached.currencies.includes(currency)) throw new Error("Payment currency unavailable");
  const converted = convertPackage(key, currency, currency === "USD" ? 1 : cached.rates[currency] || 0);
  const quote = { key, country, ...converted, expiresAt: Date.now() + quoteLifetimeMs, fallback: currency !== wanted || (currency === "USD" && !["US", "PR", "EC", "SV", "PA"].includes(country)) };
  const payload = btoa(JSON.stringify(quote));
  return { ...quote, token: `${payload}.${await signature(payload, secret)}` };
}
export async function verifyLocalQuote(token: string, key: string, secret: string) {
  if (token.length > 4096 || token.split(".").length !== 2) throw new Error("Invalid price quote");
  const [payload, signed] = token.split(".");
  if (!payload || !signed || signed.length !== 64) throw new Error("Invalid price quote");
  const expected = await signature(payload, secret);
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ signed.charCodeAt(i);
  if (difference) throw new Error("Invalid price quote");
  const quote = JSON.parse(atob(payload)) as LocalQuote;
  if (quote.key !== key || quote.expiresAt <= Date.now() || quote.expiresAt > Date.now() + quoteLifetimeMs || !billingCountries.some(([code]) => code === quote.country) || !/^[A-Z]{3}$/.test(quote.currency) || !Number.isSafeInteger(quote.amount) || quote.amount <= 0) throw new Error("Expired or invalid price quote");
  return quote;
}