import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import QuizLanding from "@/components/QuizLanding";
import QuizQuestions from "@/components/QuizQuestions";
import QuizResult from "@/components/QuizResult";
import SocialProofToasts from "@/components/SocialProofToasts";
import { useFunnelTracking } from "@/hooks/useFunnelTracking";

type QuizStep = "landing" | "questions" | "result";

export const Route = createFileRoute("/es/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz Free Fire — Evalúa tu cuenta" },
      { name: "description", content: "Descubre si tu cuenta de Free Fire puede recibir descuentos en diamantes." },
      { property: "og:title", content: "Quiz Free Fire — Evalúa tu cuenta" },
      { property: "og:description", content: "Descubre si tu cuenta de Free Fire puede recibir descuentos en diamantes." },
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
    <div className="min-h-screen bg-background">
      <main className="container py-8 md:py-12">
        <div className="max-w-md mx-auto">
          {step === "landing" && <QuizLanding onStart={() => setStep("questions")} />}
          {step === "questions" && <QuizQuestions onComplete={() => setStep("result")} />}
          {step === "questions" && <SocialProofToasts />}
          {step === "result" && <QuizResult nextPage="/es/idplayer" />}
        </div>
      </main>
    </div>
  );
}
