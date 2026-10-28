import ShopifyCheckoutRedirect from "@/components/ShopifyCheckoutRedirect";

interface GemtopCheckoutPageProps {
  priceKey: string;
  priceUsd: number;
  diamonds: number;
  lang?: "es" | "en";
  banner: string;
  bannerAlt: string;
}

export default function GemtopCheckoutPage({ priceKey, lang = "es" }: GemtopCheckoutPageProps) {
  return <ShopifyCheckoutRedirect priceKey={priceKey} lang={lang} />;
}
