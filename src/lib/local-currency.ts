import { billingCountries } from "./checkout-billing";
import { rechargePackage, type RechargeKey } from "./recharge-packages";

const localCurrencies: Record<string, string> = {
  US: "USD", PR: "USD", EC: "USD", SV: "USD", PA: "USD", MX: "MXN", CO: "COP", AR: "ARS", CL: "CLP", PE: "PEN", BO: "BOB", PY: "PYG", UY: "UYU", BR: "BRL", GT: "GTQ", HN: "HNL", NI: "NIO", CR: "CRC", DO: "DOP", BZ: "BZD", HT: "HTG", GY: "GYD", SR: "SRD", JM: "JMD", TT: "TTD", BS: "BSD", BB: "BBD", AW: "AWG", CW: "ANG", SX: "ANG", AG: "XCD", DM: "XCD", GD: "XCD", KN: "XCD", LC: "XCD", VC: "XCD", GP: "EUR", MQ: "EUR", GF: "EUR", BL: "EUR", MF: "EUR", BQ: "USD", KY: "KYD", TC: "USD", VG: "USD", VI: "USD", MS: "XCD", AD: "EUR", MC: "EUR", SM: "EUR", VA: "EUR", AX: "EUR", FO: "DKK", SJ: "NOK", GG: "GBP", JE: "GBP", IM: "GBP", GI: "GIP", BY: "BYN", RU: "RUB", CU: "CUP",
  ES: "EUR", FR: "EUR", DE: "EUR", IT: "EUR", PT: "EUR", IE: "EUR", NL: "EUR", BE: "EUR", AT: "EUR", FI: "EUR", GR: "EUR", CY: "EUR", EE: "EUR", LV: "EUR", LT: "EUR", LU: "EUR", MT: "EUR", SK: "EUR", SI: "EUR", HR: "EUR", BG: "EUR", GB: "GBP", CH: "CHF", LI: "CHF", PL: "PLN", CZ: "CZK", HU: "HUF", RO: "RON", SE: "SEK", NO: "NOK", DK: "DKK", IS: "ISK", TR: "TRY", UA: "UAH", RS: "RSD", AL: "ALL", BA: "BAM", MK: "MKD", MD: "MDL", ME: "EUR", XK: "EUR",
};
export const currencyForCountry = (country: string) => localCurrencies[country] || "USD";
export const quoteLifetimeMs = 30 * 60_000;
export const rateCacheLifetimeMs = 3_600_000;
export function resolveCheckoutCountry(manual?: string, access?: string, timezone?: string) {
  const allowed = (value?: string) => value && billingCountries.some(([code]) => code === value);
  return allowed(manual) ? manual as string : allowed(access) ? access as string : allowed(timezone) ? timezone as string : "US";
}
export const currencyScale = (currency: string) => ["CLP", "PYG"].includes(currency) ? 1 : 100;
export function convertPackage(key: RechargeKey, currency: string, rate: number) {
  if (!Number.isFinite(rate) || rate <= 0) throw new Error("Invalid exchange rate");
  const pack = rechargePackage(key);
  let amount = Math.round(pack.priceUsd * rate * currencyScale(currency));
  // Stripe requires ISK amounts in hundredths, divisible by 100.
  if (currency === "ISK") amount = Math.round(amount / 100) * 100;
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 99_999_999) throw new Error("Invalid converted amount");
  return { amount, currency, priceAmount: amount / currencyScale(currency), description: pack.statement };
}
export const formatLocalPrice = (amount: number, currency: string) => new Intl.NumberFormat("es", { style: "currency", currency, currencyDisplay: "code" }).format(amount / currencyScale(currency));
export type LocalQuote = { key: RechargeKey; country: string; currency: string; amount: number; priceAmount: number; expiresAt: number; token: string; fallback: boolean };