import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Info } from "lucide-react";
import GarenaHeader from "@/components/GarenaHeader";
import { useFunnelTracking } from "@/hooks/useFunnelTracking";

export const Route = createFileRoute("/es/idplayer")({
  head: () => ({
    meta: [
      { title: "Identificar cuenta — Free Fire España" },
      { name: "description", content: "Ingresa tu ID de jugador de Free Fire para validar tu cuenta." },
      { property: "og:title", content: "Identificar cuenta — Free Fire España" },
      { property: "og:description", content: "Ingresa tu ID de jugador de Free Fire para validar tu cuenta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IdPlayerPage,
});

function IdPlayerPage() {
  useFunnelTracking("idplayer");
  const [playerId, setPlayerId] = useState("");
  const navigate = useNavigate();

  const preserveSearch = () =>
    typeof window !== "undefined" && window.location.search
      ? Object.fromEntries(new URLSearchParams(window.location.search).entries())
      : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerId.trim()) {
      navigate({ to: "/es/recharge", search: preserveSearch() });
    }
  };

  return (
    <div className="min-h-screen gamer-bg">
      <main className="container py-4 sm:py-6 md:py-10">
        <div className="max-w-lg mx-auto">
          <GarenaHeader />

          <div className="bg-card rounded-2xl shadow-lg p-4 sm:p-6 mb-3 sm:mb-4">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                1
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">Ingresar</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="es-player-id" className="text-sm text-foreground">ID de jugador</label>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
                <input
                  id="es-player-id"
                  type="text"
                  inputMode="numeric"
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value)}
                  placeholder="Introduce el ID del jugador."
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full font-display uppercase tracking-widest text-base sm:text-lg font-bold py-3.5 px-6 rounded-xl bg-gradient-to-r from-primary to-orange-400 text-primary-foreground shadow-[0_8px_24px_rgba(255,122,20,0.35)] hover:brightness-110 active:scale-[0.98] transition-all duration-200"
              >
                Iniciar →
              </button>
            </form>
          </div>

          <div className="bg-primary/5 border border-primary/30 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <span>📊</span>
              <h3 className="font-display uppercase tracking-wider font-bold text-foreground text-sm sm:text-base">Resultado del análisis de cuenta</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Según tu perfil como jugador, tu cuenta califica para bonos variables en recargas (hasta 65%).
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Para continuar con el proceso de evaluación, ingresa tu ID de Free Fire.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
