import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Info } from "lucide-react";
import GarenaHeader from "@/components/br/GarenaHeader";
import { useFunnelTracking } from "@/hooks/useFunnelTracking";

export const Route = createFileRoute("/br/idplayer")({
  head: () => ({
    meta: [
      { title: "Identifique sua conta — Free Fire Brasil" },
      { name: "description", content: "Digite seu ID de jogador de Free Fire para continuar até a recarga." },
      { property: "og:title", content: "Identifique sua conta — Free Fire Brasil" },
      { property: "og:description", content: "Digite seu ID de jogador de Free Fire para continuar até a recarga." },
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
      try { sessionStorage.setItem("br_player_id", playerId.trim()); } catch { /* ignore */ }
      navigate({ to: "/br/recharge", search: preserveSearch() });
    }
  };

  return (
    <div lang="pt-BR" className="min-h-screen gamer-bg">
      <main className="container py-4 sm:py-6 md:py-10">
        <div className="max-w-lg mx-auto">
          <GarenaHeader />

          <div className="bg-card rounded-2xl shadow-lg p-4 sm:p-6 mb-3 sm:mb-4">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                1
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">Entrar</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="br-player-id" className="text-sm text-foreground">ID do jogador</label>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
                <input
                  id="br-player-id"
                  type="text"
                  inputMode="numeric"
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value)}
                  placeholder="Digite o ID do jogador."
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              <Button
                type="submit"
                className="h-auto whitespace-normal w-full font-display uppercase tracking-widest text-base sm:text-lg font-bold py-3.5 px-6 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200"
              >
                Continuar →
              </Button>
            </form>
          </div>

          <div className="bg-primary/5 border border-primary/30 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <span>📊</span>
              <h3 className="font-display uppercase tracking-wider font-bold text-foreground text-sm sm:text-base">Resultado da análise da conta</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              De acordo com seu perfil de jogador, sua conta se qualifica para bônus variáveis em recargas (até 65%).
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Para continuar com a avaliação, digite seu ID do Free Fire.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
