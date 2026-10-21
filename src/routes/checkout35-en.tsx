import { createFileRoute } from "@tanstack/react-router";
import GemtopCheckoutPage from "@/components/gemtop/GemtopCheckoutPage";
import freefireBannerEn from "@/assets/freefire-banner-en.jpg";
import { rechargePrice } from "@/lib/recharge-packages";

export const Route = createFileRoute("/checkout35-en")({
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
      priceKey="35"
      priceUsd={rechargePrice("35")}
      diamonds={56000}
      lang="en"
      banner={freefireBannerEn}
      bannerAlt="Diamonds at a Discount"
    />
  ),
});
