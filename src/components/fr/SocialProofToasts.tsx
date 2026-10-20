import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

const PURCHASES = [
  { name: "Lucas M.", city: "Paris, France", plan: "6 720 diamants" },
  { name: "Emma G.", city: "Lyon, France", plan: "13 440 diamants" },
  { name: "Louis R.", city: "Marseille, France", plan: "26 880 diamants" },
  { name: "Chloé V.", city: "Toulouse, France", plan: "6 720 diamants" },
  { name: "Hugo P.", city: "Nice, France", plan: "13 440 diamants" },
  { name: "Léa H.", city: "Nantes, France", plan: "6 720 diamants" },
  { name: "Gabriel F.", city: "Lille, France", plan: "26 880 diamants" },
  { name: "Camille S.", city: "Strasbourg, France", plan: "13 440 diamants" },
  { name: "Manon B.", city: "Bordeaux, France", plan: "26 880 diamants" },
  { name: "Jade N.", city: "Montpellier, France", plan: "6 720 diamants" },
];

const MIN_AGO = [1, 1, 2, 2, 3, 3, 4, 5, 6, 7, 8];

const SocialProofToasts = () => {
  const [current, setCurrent] = useState<{ name: string; city: string; plan: string; minutes: number } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timeoutShow: number;
    let timeoutHide: number;
    const showNext = () => {
      if (cancelled) return;
      const purchase = PURCHASES[Math.floor(Math.random() * PURCHASES.length)];
      const minutes = MIN_AGO[Math.floor(Math.random() * MIN_AGO.length)];
      setCurrent({ ...purchase, minutes });
      setVisible(true);
      timeoutHide = window.setTimeout(() => {
        if (cancelled) return;
        setVisible(false);
        timeoutShow = window.setTimeout(showNext, 2500 + Math.random() * 2000);
      }, 4500);
    };
    timeoutShow = window.setTimeout(showNext, 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutShow);
      window.clearTimeout(timeoutHide);
    };
  }, []);

  if (!current) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 max-w-[19rem] sm:max-w-xs transition-all duration-500 ease-out ${
        visible ? "translate-y-0 opacity-100 scale-100" : "translate-y-3 opacity-0 scale-95 pointer-events-none"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="bg-card border-2 border-success/30 rounded-xl shadow-2xl p-3 flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-full bg-success/15 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5 text-success" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">
            {current.name} <span className="text-muted-foreground font-normal">vient d’acheter</span>
          </p>
          <p className="text-xs text-success font-bold truncate">{current.plan}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {current.city} · il y a {current.minutes} min
          </p>
        </div>
      </div>
    </div>
  );
};

export default SocialProofToasts;
