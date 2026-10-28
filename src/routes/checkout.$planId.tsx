import { createFileRoute } from "@tanstack/react-router";
import ShopifyCheckoutRedirect from "@/components/ShopifyCheckoutRedirect";
import { rechargePackages } from "@/lib/recharge-packages";

export const Route = createFileRoute("/checkout/$planId")({
  head: () => ({ meta: [
    { title: "Pago Shopify — Recarga Free Fire" },
    { name: "description", content: "Finaliza tu recarga Free Fire en el checkout de Shopify." },
    { property: "og:title", content: "Pago Shopify — Recarga Free Fire" },
    { property: "og:description", content: "Finaliza tu recarga Free Fire en el checkout de Shopify." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { planId } = Route.useParams();
  const index = Number(planId) - 1;
  const pack = Number.isInteger(index) ? rechargePackages[index] : undefined;
  return <ShopifyCheckoutRedirect priceKey={pack?.key ?? ""} />;
}
