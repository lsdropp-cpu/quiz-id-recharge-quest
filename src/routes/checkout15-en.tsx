import { createFileRoute } from "@tanstack/react-router";
import GemtopCheckoutPage from "@/components/gemtop/GemtopCheckoutPage";
import freefireBannerEn from "@/assets/freefire-banner-en.jpg";

export const Route = createFileRoute("/checkout15-en")({
  head: () => ({
    meta: [
      { title: "Checkout — Diamond Bonus Free Fire" },
      { name: "description", content: "Complete your Free Fire Diamond Bonus purchase with secure card payment." },
      { property: "og:title", content: "Checkout — Diamond Bonus Free Fire" },
      { property: "og:description", content: "Complete your Free Fire Diamond Bonus purchase with secure card payment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <GemtopCheckoutPage
      priceKey="15"
      priceUsd={15.9}
      diamonds={11200}
      lang="en"
      banner={freefireBannerEn}
      bannerAlt="Diamonds at a Discount"
    />
  ),
});
