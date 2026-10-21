// Single source of truth for the Spanish recharge packs (56.000 = 35 USD).
// Display price and the amount actually charged are kept in the same row so
// the page can never show one value while Stripe charges another.

export type RechargeKey = "9" | "15" | "19" | "25" | "29" | "35";

export type RechargePackage = {
  key: RechargeKey;
  diamonds: string;
  bonus: string;
  priceUsd: number;
  cents: number;
  badge: string;
  badgeGradient: string;
  statement: string;
};

export const rechargePackages: RechargePackage[] = [
  { key: "9", diamonds: "5.600", bonus: "1.200", priceUsd: 9.9, cents: 990, badge: "MEJOR VALOR", badgeGradient: "from-violet-500 to-fuchsia-500", statement: "NMJ 5600" },
  { key: "15", diamonds: "11.200", bonus: "2.240", priceUsd: 15.9, cents: 1590, badge: "MÁS POPULAR", badgeGradient: "from-orange-500 to-pink-500", statement: "NMJ 11200" },
  { key: "19", diamonds: "22.400", bonus: "4.480", priceUsd: 19.9, cents: 1990, badge: "MEJOR OFERTA", badgeGradient: "from-violet-500 to-fuchsia-500", statement: "NMJ 22400" },
  { key: "25", diamonds: "29.500", bonus: "5.900", priceUsd: 25.9, cents: 2590, badge: "MÁXIMO BENEFICIO", badgeGradient: "from-violet-500 to-fuchsia-500", statement: "NMJ 29500" },
  { key: "29", diamonds: "39.200", bonus: "7.840", priceUsd: 29.9, cents: 2990, badge: "SUPER PACK", badgeGradient: "from-orange-500 to-pink-500", statement: "NMJ 39200" },
  { key: "35", diamonds: "56.000", bonus: "11.200", priceUsd: 35, cents: 3500, badge: "MEGA PACK", badgeGradient: "from-violet-500 to-fuchsia-500", statement: "NMJ 56000" },
];

export function rechargePackage(key: RechargeKey): RechargePackage {
  const pkg = rechargePackages.find((item) => item.key === key);
  if (!pkg) throw new Error(`Unknown recharge package: ${key}`);
  return pkg;
}

export function rechargePrice(key: RechargeKey): number {
  return rechargePackage(key).priceUsd;
}

export function rechargeCents(key: RechargeKey): number {
  return rechargePackage(key).cents;
}

export function formatRechargePrice(priceUsd: number): string {
  return priceUsd % 1 === 0 ? `$${priceUsd}` : `$${priceUsd.toFixed(2)}`;
}
