// Builds the in-app /local checkout URL for a recharge pack, keeping the
// campaign parameters that attribute the sale.
import { rechargePackages, type RechargeKey } from "./recharge-packages";
import { resolveTracking, TRACKING_KEYS } from "./tracking";

export function localCheckoutUrl(key: string, search = ""): string | null {
  const pack: RechargeKey | undefined = rechargePackages.find((p) => p.key === key)?.key;
  if (!pack) return null;

  const params = new URLSearchParams();
  params.set("p", pack);

  const tracking = resolveTracking(search);
  for (const key of TRACKING_KEYS) {
    const value = tracking[key];
    if (value) params.set(key, value);
  }

  return `/local?${params.toString()}`;
}
