import type { LocalMethodId } from "@/lib/xpag";

export function MethodLogo({ method, compact = false }: { method: LocalMethodId; compact?: boolean }) {
  const h = compact ? "h-5!" : "h-10!";
  switch (method) {
    case "OXXO":
      return (
        <svg viewBox="0 0 88 38" className={`${h} w-auto!`} aria-label="OXXO">
          <rect x="2" y="2" width="84" height="34" rx="5" fill="var(--method-gold)" />
          <rect x="4" y="6" width="80" height="26" rx="3" fill="var(--method-red)" />
          <text x="44" y="24.5" textAnchor="middle" fill="var(--method-white)" fontWeight="900" fontSize="16" fontFamily="Inter, sans-serif" letterSpacing="0.5">OXXO</text>
        </svg>
      );
    case "SPEI":
      return (
        <svg viewBox="0 0 92 38" className={`${h} w-auto!`} aria-label="SPEI">
          <text x="8" y="27" fill="var(--method-blue)" fontWeight="900" fontSize="22" fontFamily="Inter, sans-serif">SP</text>
          <text x="42" y="27" fill="var(--method-gold)" fontWeight="900" fontSize="22" fontFamily="Inter, sans-serif">E</text>
          <rect x="61" y="10" width="6" height="17" rx="1.5" fill="var(--method-blue)" />
          <polygon points="71,10 83,10 75,18 83,27 71,27 71,10" fill="var(--method-gold)" />
        </svg>
      );
    case "NEQUI":
      return (
        <svg viewBox="0 0 40 40" className={`${h} w-auto!`} aria-label="Nequi">
          <rect x="2" y="2" width="36" height="36" rx="8" fill="var(--method-pale)" stroke="var(--method-border)" />
          <rect x="10" y="12" width="4" height="4" rx="1" fill="var(--method-pink)" />
          <text x="23" y="28" textAnchor="middle" fill="var(--method-ink)" fontWeight="900" fontSize="20" fontFamily="Inter, sans-serif">N</text>
        </svg>
      );
    case "BREB":
      return (
        <svg viewBox="0 0 44 40" className={`${h} w-auto!`} aria-label="Bre-B">
          <rect x="2" y="2" width="40" height="36" rx="8" fill="var(--method-blue)" />
          <text x="22" y="24" textAnchor="middle" fill="var(--method-cyan)" fontWeight="800" fontSize="11.5" fontFamily="Inter, sans-serif">Bre-B</text>
        </svg>
      );
    case "PIX":
      return (
        <svg viewBox="0 0 68 38" className={`${h} w-auto!`} aria-label="Pix">
          <rect x="2" y="2" width="64" height="34" rx="7" fill="var(--method-mint)" stroke="var(--method-mint-border)" />
          <rect x="12" y="13" width="12" height="12" rx="2.5" transform="rotate(45 18 19)" fill="var(--method-teal)" />
          <text x="45" y="24" textAnchor="middle" fill="var(--method-teal)" fontWeight="800" fontSize="14" fontFamily="Inter, sans-serif">Pix</text>
        </svg>
      );
  }
}

export function XpagWordmark() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span>Pago procesado por</span>
      <span className="font-extrabold italic tracking-normal text-foreground text-sm">xpag</span>
    </span>
  );
}
