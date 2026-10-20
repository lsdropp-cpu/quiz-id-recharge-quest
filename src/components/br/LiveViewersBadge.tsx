import { useEffect, useState } from "react";
import { Eye, Flame } from "lucide-react";

type Props = { className?: string };

const LiveViewersBadge = ({ className = "" }: Props) => {
  const [viewers, setViewers] = useState(() => 38 + Math.floor(Math.random() * 22));
  const [slotsLeft, setSlotsLeft] = useState(() => 7 + Math.floor(Math.random() * 4));

  useEffect(() => {
    const viewerInterval = window.setInterval(() => {
      setViewers((prev) => {
        const delta = Math.floor(Math.random() * 7) - 3;
        const next = prev + delta;
        if (next < 28) return 28 + Math.floor(Math.random() * 5);
        if (next > 74) return 74 - Math.floor(Math.random() * 5);
        return next;
      });
    }, 4000);
    const slotsInterval = window.setInterval(() => {
      setSlotsLeft((prev) => {
        if (prev <= 2) return 9 + Math.floor(Math.random() * 3);
        return Math.random() < 0.3 ? prev - 1 : prev;
      });
    }, 9000);
    return () => {
      window.clearInterval(viewerInterval);
      window.clearInterval(slotsInterval);
    };
  }, []);

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      <div className="flex items-center gap-2 rounded-xl bg-card border border-border px-3 py-2 shadow-sm">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
        </span>
        <Eye className="w-4 h-4 text-muted-foreground" />
        <p className="text-xs sm:text-sm text-foreground leading-tight">
          <span className="font-bold">{viewers}</span>{" "}
          <span className="text-muted-foreground">vendo agora</span>
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/30 px-3 py-2 shadow-sm">
        <Flame className="w-4 h-4 text-destructive" />
        <p className="text-xs sm:text-sm text-foreground leading-tight">
          <span className="font-bold text-destructive">{slotsLeft}</span>{" "}
          <span className="text-muted-foreground">vagas -65% OFF</span>
        </p>
      </div>
    </div>
  );
};

export default LiveViewersBadge;
