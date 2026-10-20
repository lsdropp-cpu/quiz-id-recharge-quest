import { createFileRoute } from "@tanstack/react-router";
import GemtopCheckoutPage from "@/components/gemtop/GemtopCheckoutPage";
import membershipsBanner from "@/assets/memberships-banner.jpg";

export const Route = createFileRoute("/checkout19")({
  head: () => ({
    meta: [
      { title: "Checkout — Bono de Diamantes Free Fire" },
      { name: "description", content: "Completa tu compra del Bono de Diamantes de Free Fire con pago seguro con tarjeta." },
      { property: "og:title", content: "Checkout — Bono de Diamantes Free Fire" },
      { property: "og:description", content: "Completa tu compra del Bono de Diamantes de Free Fire con pago seguro con tarjeta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <GemtopCheckoutPage
      priceKey="19"
      priceUsd={19.90}
      diamonds={22400}
      banner={membershipsBanner}
      bannerAlt="¡Conoce las Membresías Free Fire!"
    />
  ),
});
