import { describe, test, expect } from "bun:test";
import { usdShopifyCheckoutUrl, brShopifyCheckoutUrl } from "./shopify-checkout";

describe("Shopify-only checkout handoffs", () => {
  const usd = [
    ["9", "49462223175777"], ["15", "49462223208545"],
    ["19", "49462223241313"], ["25", "49462223274081"],
    ["29", "49462223306849"], ["35", "49462223339617"],
  ];
  for (const [key, variant] of usd) {
    test(`USD pack ${key} uses its Shopify product, never Stripe`, () => {
      const url = new URL(usdShopifyCheckoutUrl(key, "?utm_id=campaign-28"));
      expect(url.origin).toBe("https://qqs5hg-h4.myshopify.com");
      expect(url.pathname).toBe(`/cart/${variant}:1`);
      expect(url.searchParams.get("attributes[utm_id]")).toBe("campaign-28");
    });
  }
  const br = ["53605831049552", "53605831082320", "53605831115088", "53605831147856", "53605831180624", "53605831213392"];
  br.forEach((variant, index) => {
    test(`Brazil pack ${index} uses its localized Shopify product`, () => {
      const url = new URL(brShopifyCheckoutUrl(index, "?utm_source=tiktok"));
      expect(url.origin).toBe("https://1ievzb-tk.myshopify.com");
      expect(url.pathname).toBe(`/cart/${variant}:1`);
      expect(url.searchParams.get("locale")).toBe("pt-BR");
      expect(url.searchParams.get("attributes[utm_source]")).toBe("tiktok");
    });
  });
  test("unknown packages do not silently select another product", () => {
    expect(usdShopifyCheckoutUrl("unknown")).toBeNull();
    expect(brShopifyCheckoutUrl(-1)).toBeNull();
    expect(brShopifyCheckoutUrl(6)).toBeNull();
  });
});