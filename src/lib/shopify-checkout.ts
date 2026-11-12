import { resolveTracking, shopifyTrackingUrl } from "./tracking";

export const usdShopifyVariants: Record<string, string> = {
  "9": "49462223175777",
  "15": "49462223208545",
  "19": "49462223241313",
  "25": "49462223274081",
  "29": "49462223306849",
  "35": "49462223339617",
};

export const brShopifyVariants = [
  "53605831049552", "53605831082320", "53605831115088",
  "53605831147856", "53605831180624", "53605831213392",
] as const;

export function usdShopifyCheckoutUrl(key: string, search = "", locale = "es") {
  const variant = usdShopifyVariants[key];
  if (!variant) return null;
  const url = new URL(`https://qqs5hg-h4.myshopify.com/cart/${variant}:1?channel=buy_button`);
  url.searchParams.set("locale", locale);
  return shopifyTrackingUrl(url.toString(), resolveTracking(search));
}

export function brShopifyCheckoutUrl(index: number, search = "") {
  const variant = brShopifyVariants[index];
  if (!variant) return null;
  const url = new URL(`https://1ievzb-tk.myshopify.com/cart/${variant}:1?channel=buy_button`);
  url.searchParams.set("locale", "pt-BR");
  return shopifyTrackingUrl(url.toString(), resolveTracking(search));
}
export const rechargeShopifyVariants: Record<string, string> = {
  "9": "53818484425040",
  "15": "53818484457808",
  "19": "53818484490576",
  "25": "53818484523344",
  "29": "53818484556112",
  "35": "53818484588880",
};

export function rechargeShopifyCheckoutUrl(key: string, search = "", locale = "es") {
  const variant = rechargeShopifyVariants[key];
  if (!variant) return null;
  const url = new URL(`https://1ievzb-tk.myshopify.com/cart/${variant}:1?channel=buy_button`);
  url.searchParams.set("locale", locale);
  return shopifyTrackingUrl(url.toString(), resolveTracking(search));
}
