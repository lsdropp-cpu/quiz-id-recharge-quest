import type { RechargeKey } from "./recharge-packages";

// Fixed destinations keep the chosen pack independent of campaign parameters.
export const rechargeCheckoutDestinations = {
  "9": "/checkoutt",
  "15": "/checkoutt15",
  "19": "/checkoutt19",
  "25": "/checkoutt25",
  "29": "/checkoutt29",
  "35": "/checkoutt35",
} as const satisfies Record<RechargeKey, string>;

export function rechargeCheckoutSearch(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  // The destination fixes the pack; stale /checkoutt preview parameters cannot override it.
  params.delete("p");
  params.delete("vercarteiras");
  return Object.fromEntries(params);
}