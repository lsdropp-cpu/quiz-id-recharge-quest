import { createFileRoute } from "@tanstack/react-router";
import LocalXpagCheckout from "@/components/local-checkout/LocalXpagCheckout";
import { TRACKING_KEYS, type TrackingParams } from "@/lib/tracking";
import type { RechargeKey } from "@/lib/recharge-packages";

const KEYS = [9, 15, 19, 25, 29, 35] as const;

export const Route = createFileRoute("/local")({
  // `p` stays a number so the address bar reads /local?p=19 instead of /local?p=%2219%22.
  validateSearch: (s: Record<string, unknown>): { p?: number } & TrackingParams => {
    const raw = s["p"];
    const p = typeof raw === "number" ? raw : Number(String(raw ?? ""));
    const out: { p?: number } & TrackingParams = {};
    if ((KEYS as readonly number[]).includes(p)) out.p = p;
    // Keep campaign parameters in the address bar so attribution survives the
    // client-side navigation from /recharge.
    for (const key of TRACKING_KEYS) {
      const value = typeof s[key] === "number" ? String(s[key]) : s[key];
      if (typeof value === "string" && value.trim()) out[key] = value;
    }
    return out;
  },
  head: () => ({
    meta: [
      { title: "Pagamento local — Recarga de Diamantes" },
      { name: "description", content: "Finalize sua recarga com pagamento local via OXXO, SPEI, Nequi ou Bre-B." },
      { property: "og:title", content: "Pagamento local — Recarga de Diamantes" },
      { property: "og:description", content: "Finalize sua recarga com pagamento local via OXXO, SPEI, Nequi ou Bre-B." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LocalCheckoutPage,
});

function LocalCheckoutPage() {
  const { p } = Route.useSearch();
  return <LocalXpagCheckout priceKey={String(p ?? 9) as RechargeKey} />;
}