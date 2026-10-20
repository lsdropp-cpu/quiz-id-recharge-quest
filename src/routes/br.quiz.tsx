import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import QuizLanding from "@/components/br/QuizLanding";
import QuizQuestions from "@/components/br/QuizQuestions";
import QuizResult from "@/components/br/QuizResult";
import SocialProofToasts from "@/components/br/SocialProofToasts";
import { useFunnelTracking } from "@/hooks/useFunnelTracking";

type QuizStep = "landing" | "questions" | "result";

export const Route = createFileRoute("/br/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz Free Fire — Avalie sua conta no Brasil" },
      { name: "description", content: "Descubra se sua conta Free Fire pode receber descontos na compra de diamantes." },
      { property: "og:title", content: "Quiz Free Fire — Avalie sua conta no Brasil" },
      { property: "og:description", content: "Descubra se sua conta Free Fire pode receber descontos na compra de diamantes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuizPage,
});

function QuizPage() {
  useFunnelTracking("quiz");
  const [step, setStep] = useState<QuizStep>("landing");
  return (
    <div lang="pt-BR" className="min-h-screen bg-background">
      <main className="container py-8 md:py-12">
        <div className="max-w-md mx-auto">
          {step === "landing" && <QuizLanding onStart={() => setStep("questions")} />}
          {step === "questions" && <QuizQuestions onComplete={() => setStep("result")} />}
          {step === "questions" && <SocialProofToasts />}
          {step === "result" && <QuizResult />}
        </div>
      </main>
    </div>
  );
}
