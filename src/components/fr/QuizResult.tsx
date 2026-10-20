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
    { label: "Niveau du joueur :", value: "Compétitif" },
    { label: "Activité :", value: "Élevée" },
    { label: "État du compte :", value: "Éligible aux bonus" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="bg-card rounded-2xl shadow-lg p-6 md:p-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center text-4xl">🎉</div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-6">
          Évaluation terminée !
        </h1>

        <div className="space-y-3 mb-6">
          {results.map((item) => (
            <div
              key={item.label}
              className="flex flex-wrap gap-2 items-center justify-between bg-success/10 rounded-xl p-4 border border-success/20"
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
            Votre compte est éligible à un bonus spécial
          </p>
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Clock className="w-4 h-4" />
            <span>valable pour une durée limitée</span>
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
            <Gift className="w-5 h-5" />
            <span>Bonus débloqué :</span>
          </div>
          <p className="text-5xl font-bold text-success">–45%</p>
          <p className="text-muted-foreground mt-1">sur la recharge de diamants</p>
        </div>

        <Button
          onClick={() => navigate({ to: "/fr/idplayer", search: preserveSearch() })}
          className="h-auto whitespace-normal w-full text-lg font-semibold py-4 px-6 rounded-xl bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 hover:brightness-110 transition-all duration-200 flex items-center justify-center gap-2 animate-pulse-glow"
        >
          <span>Obtenir mon bonus</span>
          <span>🎁</span>
        </Button>
      </div>
    </div>
  );
};

export default QuizResult;
