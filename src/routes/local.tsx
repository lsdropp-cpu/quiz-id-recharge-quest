import { createFileRoute } from "@tanstack/react-router";
import LocalXpagCheckout from "@/components/local-checkout/LocalXpagCheckout";
import type { RechargeKey } from "@/lib/recharge-packages";

const KEYS = ["9", "15", "19", "25", "29", "35"] as const;

export const Route = createFileRoute("/local")({
  validateSearch: (s: Record<string, unknown>): { p?: RechargeKey } => {
    const p = String(s["p"] ?? "");
    return (KEYS as readonly string[]).includes(p) ? { p: p as RechargeKey } : {};
  },
  head: () => ({
    meta: [
      { title: "Pagamento local — Recarga de Diamantes" },
      { name: "description", content: "Finalize sua recarga com pagamento local via OXXO, SPEI, Nequi, Bre-B ou Pix." },
      { property: "og:title", content: "Pagamento local — Recarga de Diamantes" },
      { property: "og:description", content: "Finalize sua recarga com pagamento local via OXXO, SPEI, Nequi, Bre-B ou Pix." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LocalCheckoutPage,
});

function LocalCheckoutPage() {
  const { p } = Route.useSearch();
  return <LocalXpagCheckout priceKey={p ?? "9"} />;
}