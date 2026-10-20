import { resolveTracking } from "@/lib/tracking";

export const frPackages = [
  { diamonds: "5 600", bonus: "1 200", cents: 995, badge: "MEILLEUR PRIX", variant: "53818484425040" },
  { diamonds: "11 200", bonus: "2 240", cents: 1695, badge: "LE PLUS POPULAIRE", variant: "53818484457808" },
  { diamonds: "22 400", bonus: "4 480", cents: 1895, badge: "MEILLEURE OFFRE", variant: "53818484490576" },
  { diamonds: "29 500", bonus: "5 900", cents: 2495, badge: "AVANTAGE MAXIMAL", variant: "53818484523344" },
  { diamonds: "39 200", bonus: "7 840", cents: 2995, badge: "SUPER PACK", variant: "53818484556112" },
  { diamonds: "56 000", bonus: "11 200", cents: 3495, badge: "MÉGA PACK", variant: "53818484588880" },
] as const;

export const formatEUR = (cents: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

export function buildFrenchCheckoutUrl(variant: string, search: string) {
  const url = new URL(`https://1ievzb-tk.myshopify.com/cart/${variant}:1?channel=buy_button`);
  const params = new URLSearchParams(search);
  params.forEach((value, key) => { if (!url.searchParams.has(key)) url.searchParams.append(key, value); });
  url.searchParams.set("locale", "fr");
  Object.entries(resolveTracking(params)).forEach(([key, value]) => {
    if (value && !url.searchParams.get(key)) url.searchParams.set(key, value);
  });
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "src", "sck"]) {
    const value = url.searchParams.get(key);
    if (value) url.searchParams.set(`attributes[${key}]`, value);
  }
  return url.toString();
}