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

const esCents = [990, 1590, 1990, 2500, 2990, 3500] as const;

const esVariants = [
  "50208116834401",
  "50208116867169",
  "50208116899937",
  "50208116932705",
  "50208116965473",
  "50208116998241",
] as const;

export const esPackages = frPackages.map((pkg, i) => ({
  diamonds: pkg.diamonds,
  bonus: pkg.bonus,
  cents: esCents[i],
  badge: esBadges[i],
  variant: esVariants[i],
}));

export { formatEUR };

export function buildSpainCheckoutUrl(variant: string, search: string) {
  const url = new URL(`https://qqs5hg-h4.myshopify.com/cart/${variant}:1?channel=buy_button`);
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
