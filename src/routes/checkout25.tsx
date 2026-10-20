import { createFileRoute } from "@tanstack/react-router";
import GemtopCheckoutPage from "@/components/gemtop/GemtopCheckoutPage";
import membershipsBanner from "@/assets/memberships-banner.jpg";

export const Route = createFileRoute("/checkout25")({
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
      priceKey="25"
      priceUsd={25.9}
      diamonds={29500}
      banner={membershipsBanner}
      bannerAlt="¡Conoce las Membresías Free Fire!"
    />
  ),
});
