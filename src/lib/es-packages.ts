import { frPackages, formatEUR } from "@/lib/fr-packages";
import { resolveTracking } from "@/lib/tracking";

const esBadges = [
  "MEJOR VALOR",
  "MÁS POPULAR",
  "MEJOR OFERTA",
  "MÁXIMO BENEFICIO",
  "SUPER PACK",
  "MEGA PACK",
] as const;

export const esPackages = frPackages.map((pkg, i) => ({
  diamonds: pkg.diamonds,
  bonus: pkg.bonus,
  cents: pkg.cents,
  badge: esBadges[i],
  variant: pkg.variant,
}));

export { formatEUR };

export function buildSpainCheckoutUrl(variant: string, search: string) {
  const url = new URL(`https://1ievzb-tk.myshopify.com/cart/${variant}:1?channel=buy_button`);
  const params = new URLSearchParams(search);
  params.forEach((value, key) => { if (!url.searchParams.has(key)) url.searchParams.append(key, value); });
  url.searchParams.set("locale", "es");
  Object.entries(resolveTracking(params)).forEach(([key, value]) => {
    if (value && !url.searchParams.get(key)) url.searchParams.set(key, value);
  });
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "src", "sck"]) {
    const value = url.searchParams.get(key);
    if (value) url.searchParams.set(`attributes[${key}]`, value);
  }
  return url.toString();
}
