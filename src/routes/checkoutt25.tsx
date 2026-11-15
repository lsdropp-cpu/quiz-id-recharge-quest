import { createFileRoute } from "@tanstack/react-router";
import UploadedStripeCheckout from "@/components/checkoutt/UploadedStripeCheckout";

export const Route = createFileRoute("/checkoutt25")({
  head: () => ({
    meta: [
      { title: "Pago seguro de 29.500 diamantes — Free Fire" },
      { name: "description", content: "Completa tu recarga de 29.500 diamantes Free Fire con pago seguro y datos de facturación." },
      { property: "og:title", content: "Pago seguro de 29.500 diamantes — Free Fire" },
      { property: "og:description", content: "Completa tu recarga de 29.500 diamantes Free Fire con pago seguro y datos de facturación." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  return <UploadedStripeCheckout priceKey="25" />;
}
