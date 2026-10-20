import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Gift } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

const QuizResult = () => {
  const navigate = useNavigate();

  const preserveSearch = () =>
    typeof window !== "undefined" && window.location.search
      ? Object.fromEntries(new URLSearchParams(window.location.search).entries())
      : undefined;

  const results = [
    { label: "Nível do jogador:", value: "Competitivo" },
    { label: "Atividade:", value: "Alta" },
    { label: "Status da conta:", value: "Apta para bônus" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center text-4xl">🎉</div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-6">
          Avaliação concluída com sucesso!
        </h1>

        <div className="space-y-3 mb-6">
          {results.map((item) => (
            <div
              key={item.label}
              className="flex flex-wrap items-center justify-between gap-2 bg-success/10 rounded-xl p-4 border border-success/20"
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
            Sua conta foi aprovada para receber um bônus especial
          </p>
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Clock className="w-4 h-4" />
            <span>válido por tempo limitado</span>
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
            <Gift className="w-5 h-5" />
            <span>Bônus liberado:</span>
          </div>
          <p className="text-5xl font-bold text-success">–45%</p>
          <p className="text-muted-foreground mt-1">na recarga de diamantes</p>
        </div>

        <Button
          onClick={() => navigate({ to: "/br/idplayer", search: preserveSearch() })}
          className="h-auto whitespace-normal w-full text-lg font-semibold py-4 px-6 rounded-xl bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 hover:brightness-110 transition-all duration-200 flex items-center justify-center gap-2 animate-pulse-glow"
        >
          <span>Resgatar meu bônus</span>
          <span>🎁</span>
        </Button>
      </div>
    </div>
  );
};

export default QuizResult;
