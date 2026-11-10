import { createFileRoute } from "@tanstack/react-router";
import ShopifyStyleCheckout from "@/components/checkoutt/ShopifyStyleCheckout";

export const Route = createFileRoute("/es/checkoutt25")({
  head: () => ({
    meta: [
      { title: "Pago de 29.500 diamantes en euros — Free Fire España" },
      { name: "description", content: "Completa tu recarga de 29.500 diamantes Free Fire con pago seguro en EUR." },
      { property: "og:title", content: "Pago de 29.500 diamantes en euros — Free Fire España" },
      { property: "og:description", content: "Completa tu recarga de 29.500 diamantes Free Fire con pago seguro en EUR." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  return <ShopifyStyleCheckout priceKey="25" currency="EUR" />;
}
