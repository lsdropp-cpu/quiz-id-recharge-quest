import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/presell")({
  head: () => ({
    meta: [
      { title: "Oferta exclusiva — Free Fire" },
      { name: "description", content: "Accede a tu oferta exclusiva de diamantes para Free Fire." },
      { property: "og:title", content: "Oferta exclusiva — Free Fire" },
      { property: "og:description", content: "Accede a tu oferta exclusiva de diamantes para Free Fire." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PresellPage,
});

function PresellPage() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate({ to: "/quiz" });
  };

  return (
    <div className="min-h-screen gamer-bg flex items-center justify-center px-4">
      <button
        onClick={handleClick}
        className="w-full max-w-sm font-display uppercase tracking-widest text-lg font-bold py-4 px-6 rounded-xl bg-gradient-to-r from-primary to-orange-400 text-primary-foreground shadow-[0_8px_30px_rgba(255,122,20,0.4)] hover:brightness-110 active:scale-[0.98] transition-all duration-200 animate-pulse-glow"
      >
        Comenzar ahora →
      </button>
    </div>
  );
}
