import { CheckCircle2, Clock, Gift } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

const QuizResult = ({ nextPage = "/idplayer" }: { nextPage?: "/idplayer" | "/idplayer2" | "/es/idplayer" }) => {
  const navigate = useNavigate();

  const preserveSearch = () =>
    typeof window !== "undefined" && window.location.search
      ? Object.fromEntries(new URLSearchParams(window.location.search).entries())
      : undefined;

  const results = [
    { label: "Nivel del jugador:", value: "Competitivo" },
    { label: "Actividad:", value: "Alta" },
    { label: "Estado de cuenta:", value: "Apta para bonos" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center text-4xl">🎉</div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-6">
          ¡Evaluación completada con éxito!
        </h1>

        <div className="space-y-3 mb-6">
          {results.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between bg-success/10 rounded-xl p-4 border border-success/20"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span className="text-foreground">{item.label}</span>
              </div>
              <span className="text-success font-bold">{item.value}</span>
            </div>
          ))}
        </div>

        <div className="bg-primary/10 rounded-xl p-4 mb-6 text-center border border-primary/20">
          <p className="text-foreground font-medium mb-1">
            Tu cuenta fue aprobada para recibir un bono especial
          </p>
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Clock className="w-4 h-4" />
            <span>válido por tiempo limitado</span>
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
            <Gift className="w-5 h-5" />
            <span>Bono liberado:</span>
          </div>
          <p className="text-5xl font-bold text-success">–45%</p>
          <p className="text-muted-foreground mt-1">en recarga de diamantes</p>
        </div>

        <button
          onClick={() => navigate({ to: nextPage, search: preserveSearch() })}
          className="w-full text-lg font-semibold py-4 px-6 rounded-xl bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 hover:brightness-110 transition-all duration-200 flex items-center justify-center gap-2 animate-pulse-glow"
        >
          <span>Reclamar mi bono</span>
          <span>🎁</span>
        </button>
      </div>
    </div>
  );
};

export default QuizResult;
