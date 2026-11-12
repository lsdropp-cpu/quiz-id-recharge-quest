import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import GarenaHeader from "@/components/GarenaHeader";
import LiveViewersBadge from "@/components/LiveViewersBadge";
import SocialProofToasts from "@/components/SocialProofToasts";
import diamondIcon from "@/assets/diamond-icon.png";
import { useFunnelTracking } from "@/hooks/useFunnelTracking";
import { rechargePackages, formatRechargePrice } from "@/lib/recharge-packages";
import { rechargeShopifyCheckoutUrl } from "@/lib/shopify-checkout";
import { Button } from "@/components/ui/button";

const packages = rechargePackages.map((pkg) => ({
  ...pkg,
  price: formatRechargePrice(pkg.priceUsd),
}));


export const Route = createFileRoute("/recharge")({
  head: () => ({
    meta: [
      { title: "Recarga de Diamantes — Free Fire" },
      { name: "description", content: "Selecciona tu paquete de diamantes con bono especial desbloqueado." },
      { property: "og:title", content: "Recarga de Diamantes — Free Fire" },
      { property: "og:description", content: "Selecciona tu paquete de diamantes con bono especial desbloqueado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RechargePage,
});

function RechargePage() {
  useFunnelTracking("recharge");


  return (
    <div className="min-h-screen gamer-bg">
      <main className="container py-4 sm:py-6 md:py-10">
        <div className="max-w-lg mx-auto">
          <GarenaHeader />

          <LiveViewersBadge className="mb-3 sm:mb-4" />

          <div className="bg-card rounded-2xl shadow-lg p-4 sm:p-6 mb-3 sm:mb-4">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                1
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">Cuenta</h2>
            </div>

            <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3 sm:p-4 border border-border">
              <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm sm:text-base">Jugador identificado</p>
                <p className="text-success text-xs sm:text-sm font-medium">Desbloqueado 65% de descuento</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-lg p-4 sm:p-6 mb-3 sm:mb-4">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                2
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">Elige tu recarga con bono</h2>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
              {packages.map((pkg, i) => (
                <Button variant="ghost"
                  key={i}
                  onClick={() => {
                    const url = rechargeShopifyCheckoutUrl(pkg.key, window.location.search);
                    if (url) window.location.href = url;
                  }}
                  className="go-to-checkout relative block h-auto p-0 whitespace-normal rounded-2xl border-2 overflow-hidden text-center transition-all bg-card border-border hover:border-primary/50 hover:shadow-[0_0_24px_rgba(255,122,20,0.25)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className={`bg-gradient-to-r ${pkg.badgeGradient} text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest py-1.5 sm:py-2`}>
                    {pkg.badge}
                  </div>
                  <div className="p-2 sm:p-3">
                    <div className="flex items-center justify-center gap-2 sm:gap-2.5 mb-1">
                      <img src={diamondIcon} alt="" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                      <span className="font-display font-bold text-foreground text-lg sm:text-xl leading-none">{pkg.diamonds}</span>
                    </div>
                    <p className="text-violet-400 font-medium text-[10px] sm:text-xs">Diamantes</p>
                    <div className="w-12 h-px bg-border mx-auto my-2 sm:my-2.5" />
                    <p className="font-display text-primary font-extrabold text-2xl sm:text-3xl tracking-tight drop-shadow-[0_0_8px_rgba(255,122,20,0.4)]">{pkg.price}</p>
                    <div className="mt-2 sm:mt-3 bg-primary/10 border border-primary/30 rounded-lg py-1.5 px-2">
                      <p className="text-primary text-[10px] sm:text-xs font-semibold">+ {pkg.bonus} Diamantes bonus</p>
                    </div>
                  </div>
                </Button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center mb-2 leading-relaxed">
              Tus créditos se acreditarán a tu cuenta de juego tan pronto como recibamos la confirmación del pago. Además de los diamantes de bonificación, también recibirás una bonificación del 20% en los artículos del juego.
            </p>
            <p className="text-xs text-primary text-center font-medium">
              ¡El importe de la recarga se convertirá automáticamente a tu moneda local!
            </p>
          </div>
        </div>
      </main>
      <SocialProofToasts />
    </div>
  );
}
