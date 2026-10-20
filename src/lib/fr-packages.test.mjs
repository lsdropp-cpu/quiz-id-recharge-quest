import { describe, test, expect } from "bun:test";
import { frPackages, buildFrenchCheckoutUrl } from "./fr-packages";

describe("French checkout mapping", () => {
  const expected = [
    ["5 600", "53818484425040"], ["11 200", "53818484457808"],
    ["22 400", "53818484490576"], ["29 500", "53818484523344"],
    ["39 200", "53818484556112"], ["56 000", "53818484588880"],
  ];
  expected.forEach(([diamonds, variant], index) => {
    test(`${diamonds} uses the provided checkout`, () => {
      const pkg = frPackages[index];
      expect(pkg.diamonds).toBe(diamonds);
      const url = new URL(buildFrenchCheckoutUrl(pkg.variant, "?utm_source=tiktok&utm_campaign=fr&src=ad&sck=click"));
      expect(url.hostname).toBe("1ievzb-tk.myshopify.com");
      expect(url.pathname).toBe(`/cart/${variant}:1`);
      expect(url.searchParams.get("channel")).toBe("buy_button");
      expect(url.searchParams.get("locale")).toBe("fr");
    });
  });
  test("preserves URL attribution and Shopify cart attributes", () => {
    const params = { utm_source: "tiktok", utm_medium: "paid", utm_campaign: "france", utm_content: "creative", utm_term: "game", src: "ad", sck: "click" };
    const url = new URL(buildFrenchCheckoutUrl(frPackages[0].variant, new URLSearchParams(params).toString()));
    for (const [key, value] of Object.entries(params)) {
      expect(url.searchParams.get(key)).toBe(value);
      expect(url.searchParams.get(`attributes[${key}]`)).toBe(value);
    }
  });
});
