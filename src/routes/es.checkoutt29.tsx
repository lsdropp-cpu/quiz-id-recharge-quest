import { createFileRoute } from "@tanstack/react-router";
import ShopifyStyleCheckout from "@/components/checkoutt/ShopifyStyleCheckout";

export const Route = createFileRoute("/es/checkoutt29")({
  head: () => ({
    meta: [
      { title: "Pago de 39.200 diamantes en euros — Free Fire España" },
      { name: "description", content: "Completa tu recarga de 39.200 diamantes Free Fire con pago seguro en EUR." },
      { property: "og:title", content: "Pago de 39.200 diamantes en euros — Free Fire España" },
      { property: "og:description", content: "Completa tu recarga de 39.200 diamantes Free Fire con pago seguro en EUR." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  return <ShopifyStyleCheckout priceKey="29" currency="EUR" />;
}
