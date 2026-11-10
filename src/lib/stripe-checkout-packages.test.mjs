import { test, expect } from "bun:test";
import { stripeCheckoutPackage, stripeCheckoutPrices, euroCheckoutDestinations } from "./stripe-checkout-packages";

const values = [["9", 990, 990], ["15", 1590, 1590], ["19", 1990, 1990], ["25", 2500, 2500], ["29", 2990, 2990], ["35", 3500, 3500]];
for (const [key, usd, eur] of values) {
  test(`USD ${key} retains its charge amount`, () => {
    expect(stripeCheckoutPackage(key).cents).toBe(usd);
    expect(stripeCheckoutPackage(key).priceAmount).toBe(usd / 100);
    expect(stripeCheckoutPrices[key]).toMatchObject({ amount: usd, currency: "usd" });
  });
  test(`EUR ${key} uses the ES offer for card and wallet amounts`, () => {
    const offer = stripeCheckoutPackage(key, "EUR");
    expect(offer.cents).toBe(eur);
    expect(offer.priceAmount).toBe(eur / 100);
    expect(offer.currency).toBe("EUR");
    expect(stripeCheckoutPrices[offer.paymentKey]).toMatchObject({ amount: eur, currency: "eur" });
    expect(euroCheckoutDestinations[key]).toBe(`/es/checkoutt${key === "9" ? "" : key}`);
  });
}
test("unknown payment keys cannot supply a custom amount or currency", () => {
  expect(stripeCheckoutPrices.eur_1).toBeUndefined();
  expect(stripeCheckoutPrices.eur_99).toBeUndefined();
  expect(() => stripeCheckoutPackage("99", "EUR")).toThrow();
});