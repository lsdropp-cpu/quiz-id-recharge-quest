import { rechargePackages, type RechargeKey } from "./recharge-packages";
import { esPackages } from "./es-packages";

export type CheckoutCurrency = "USD" | "EUR";

export function stripeCheckoutPackage(key: RechargeKey, currency: CheckoutCurrency = "USD") {
  const index = rechargePackages.findIndex((pack) => pack.key === key);
  const pack = rechargePackages[index];
  if (!pack) throw new Error(`Unknown checkout package: ${key}`);
  const cents = currency === "EUR" ? esPackages[index].cents : pack.cents;
  return { ...pack, cents, priceAmount: cents / 100, currency, paymentKey: currency === "EUR" ? `eur_${key}` : key };
}

export const stripeCheckoutPrices: Record<string, { amount: number; description: string; currency: "usd" | "eur" }> = {
  "1": { amount: 100, description: "NMJ Test", currency: "usd" },
  ...Object.fromEntries(rechargePackages.flatMap((pack) => ["USD", "EUR"].map((currency) => {
    const offer = stripeCheckoutPackage(pack.key, currency as CheckoutCurrency);
    return [offer.paymentKey, { amount: offer.cents, description: offer.statement, currency: offer.currency === "EUR" ? "eur" : "usd" }];
  }))),
};

export const euroCheckoutDestinations = {
  "9": "/es/checkoutt", "15": "/es/checkoutt15", "19": "/es/checkoutt19",
  "25": "/es/checkoutt25", "29": "/es/checkoutt29", "35": "/es/checkoutt35",
} as const;