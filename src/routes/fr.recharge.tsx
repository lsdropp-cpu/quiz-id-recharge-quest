import { Button } from "@/components/ui/button";
import { frPackages, formatEUR, buildFrenchCheckoutUrl } from "@/lib/fr-packages";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import GarenaHeader from "@/components/fr/GarenaHeader";
import LiveViewersBadge from "@/components/fr/LiveViewersBadge";
import SocialProofToasts from "@/components/fr/SocialProofToasts";
import diamondIcon from "@/assets/diamond-icon.png";
import { useFunnelTracking } from "@/hooks/useFunnelTracking";


export const Route = createFileRoute("/fr/recharge")({
  head: () => ({
    meta: [
      { title: "Recharge de diamants — Free Fire France" },
      { name: "description", content: "Choisissez votre pack de diamants avec bonus, en euros." },
      { property: "og:title", content: "Recharge de diamants — Free Fire France" },
      { property: "og:description", content: "Choisissez votre pack de diamants avec bonus, en euros." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RechargePage,
});

function RechargePage() {
  useFunnelTracking("recharge");

  return (
    <div lang="fr" className="min-h-screen gamer-bg">
      <main className="container py-4 sm:py-6 md:py-10">
        <div className="max-w-lg mx-auto">
          <GarenaHeader />

          <LiveViewersBadge className="mb-3 sm:mb-4" />

          <div className="bg-card rounded-2xl shadow-lg p-4 sm:p-6 mb-3 sm:mb-4">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                1
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">Compte</h2>
            </div>

            <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3 sm:p-4 border border-border">
              <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm sm:text-base">Joueur identifié</p>
                <p className="text-success text-xs sm:text-sm font-medium">Réduction de 65 % débloquée</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-lg p-4 sm:p-6 mb-3 sm:mb-4">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                2
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">Choisissez votre recharge avec bonus</h2>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
              {frPackages.map((pkg, i) => (
                <Button
                  key={i}
                  onClick={() => {
                    window.location.href = buildFrenchCheckoutUrl(pkg.variant, window.location.search);
                  }}
                  className="go-to-checkout h-auto whitespace-normal block p-0 relative rounded-2xl border-2 overflow-hidden text-center transition-all bg-card border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className={`bg-primary/15 text-foreground text-[10px] sm:text-xs font-bold uppercase tracking-widest py-1.5 sm:py-2`}>
                    {pkg.badge}
                  </div>
                  <div className="p-2 sm:p-3">
                    <div className="flex items-center justify-center gap-2 sm:gap-2.5 mb-1">
                      <img src={diamondIcon} alt="" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                      <span className="font-display font-bold text-foreground text-lg sm:text-xl leading-none">{pkg.diamonds}</span>
                    </div>
                    <p className="text-muted-foreground font-medium text-[10px] sm:text-xs">Diamants</p>
                    <div className="w-12 h-px bg-border mx-auto my-2 sm:my-2.5" />
                    <p className="font-display text-primary font-extrabold text-2xl sm:text-3xl tracking-normal">{formatEUR(pkg.cents)}</p>
                    <div className="mt-2 sm:mt-3 bg-primary/10 border border-primary/30 rounded-lg py-1.5 px-2">
                      <p className="text-primary text-[10px] sm:text-xs font-semibold">+ {pkg.bonus} diamants bonus</p>
                    </div>
                  </div>
                </Button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center mb-2 leading-relaxed">
              Vos crédits seront ajoutés à votre compte de jeu dès confirmation du paiement. En plus des diamants bonus, vous recevrez également un bonus de 20 % sur les objets du jeu.
            </p>
            <p className="text-xs text-primary text-center font-medium">
              Le montant de la recharge sera automatiquement converti dans votre devise locale !
            </p>
          </div>
        </div>
      </main>
      <SocialProofToasts />
    </div>
  );
}
