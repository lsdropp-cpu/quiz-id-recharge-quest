import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import QuizLanding from "@/components/fr/QuizLanding";
import QuizQuestions from "@/components/fr/QuizQuestions";
import QuizResult from "@/components/fr/QuizResult";
import SocialProofToasts from "@/components/fr/SocialProofToasts";
import { useFunnelTracking } from "@/hooks/useFunnelTracking";

type QuizStep = "landing" | "questions" | "result";

export const Route = createFileRoute("/fr/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz Free Fire — Évaluez votre compte" },
      { name: "description", content: "Découvrez si votre compte Free Fire peut bénéficier de réductions sur les diamants." },
      { property: "og:title", content: "Quiz Free Fire — Évaluez votre compte" },
      { property: "og:description", content: "Découvrez si votre compte Free Fire peut bénéficier de réductions sur les diamants." },
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
    <div lang="fr" className="min-h-screen bg-background">
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
