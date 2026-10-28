import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { brShopifyCheckoutUrl, usdShopifyCheckoutUrl } from "@/lib/shopify-checkout";

type Props = { priceKey: string; lang?: "es" | "en" } | { brPlan: number };

export default function ShopifyCheckoutRedirect(props: Props) {
  const isBrazil = "brPlan" in props;
  const key = "priceKey" in props ? props.priceKey : "";
  const lang = "lang" in props ? props.lang ?? "es" : "pt-BR";
  const plan = "brPlan" in props ? props.brPlan : -1;
  const destination = () => isBrazil
    ? brShopifyCheckoutUrl(plan, window.location.search)
    : usdShopifyCheckoutUrl(key, window.location.search, lang);

  useEffect(() => {
    const url = destination();
    window.location.replace(url ?? (isBrazil ? "/br/recharge" : "/recharge"));
  }, [isBrazil, key, lang, plan]);

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4">
      <Loader2 aria-hidden="true" className="size-6 animate-spin motion-reduce:animate-none" />
      <Button onClick={() => {
        const url = destination();
        window.location.replace(url ?? (isBrazil ? "/br/recharge" : "/recharge"));
      }}>
        {isBrazil ? "Continuar para pagamento" : lang === "en" ? "Continue to payment" : "Continuar al pago"}
      </Button>
    </main>
  );
}