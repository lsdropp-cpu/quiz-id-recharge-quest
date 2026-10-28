import { createFileRoute } from "@tanstack/react-router";
import ShopifyCheckoutRedirect from "@/components/ShopifyCheckoutRedirect";

export const Route = createFileRoute("/br/checkout/$plan")({
  head: () => ({ meta: [
    { title: "Pagamento Shopify — Recarga Free Fire Brasil" },
    { name: "description", content: "Finalize sua recarga de diamantes no checkout da Shopify." },
    { property: "og:title", content: "Pagamento Shopify — Recarga Free Fire Brasil" },
    { property: "og:description", content: "Finalize sua recarga de diamantes no checkout da Shopify." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { plan } = Route.useParams();
  const index = /^\d+$/.test(plan) ? Number(plan) : -1;
  return <ShopifyCheckoutRedirect brPlan={index} />;
}
