import { createFileRoute } from "@tanstack/react-router";
import ShopifyStyleCheckout from "@/components/checkoutt/ShopifyStyleCheckout";
import type { RechargeKey } from "@/lib/recharge-packages";

const KEYS = ["9", "15", "19", "25", "29", "35"] as const;

export const Route = createFileRoute("/checkoutt")({
  validateSearch: (s: Record<string, unknown>): { p?: RechargeKey } => {
    const p = String(s.p ?? "");
    return (KEYS as readonly string[]).includes(p) ? { p: p as RechargeKey } : {};
  },
  head: () => ({
    meta: [
      { title: "Checkout seguro — Bono de Diamantes Free Fire" },
      { name: "description", content: "Finaliza tu compra de diamantes Free Fire con pago seguro." },
      { property: "og:title", content: "Checkout seguro — Bono de Diamantes Free Fire" },
      { property: "og:description", content: "Finaliza tu compra de diamantes Free Fire con pago seguro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckouttPage,
});

function CheckouttPage() {
  const { p } = Route.useSearch();
  return <ShopifyStyleCheckout priceKey={p ?? "9"} />;
}
