import type { LocalMethodId } from "@/lib/xpag";

export function MethodLogo({ method, compact = false }: { method: LocalMethodId; compact?: boolean }) {
  const h = compact ? "h-5" : "h-9";
  switch (method) {
    case "OXXO":
      return (
        <svg viewBox="0 0 88 38" className={`${h} w-auto`} aria-label="OXXO">
          <rect x="2" y="2" width="84" height="34" rx="5" fill="#FACC15" />
          <rect x="4" y="6" width="80" height="26" rx="3" fill="#DC2626" />
          <text x="44" y="24.5" textAnchor="middle" fill="#FFFFFF" fontWeight="900" fontSize="16" fontFamily="Inter, sans-serif" letterSpacing="0.5">OXXO</text>
        </svg>
      );
    case "SPEI":
      return (
        <svg viewBox="0 0 92 38" className={`${h} w-auto`} aria-label="SPEI">
          <text x="8" y="27" fill="#1E3A8A" fontWeight="900" fontSize="22" fontFamily="Inter, sans-serif">SP</text>
          <text x="42" y="27" fill="#F59E0B" fontWeight="900" fontSize="22" fontFamily="Inter, sans-serif">E</text>
          <rect x="61" y="10" width="6" height="17" rx="1.5" fill="#1E3A8A" />
          <polygon points="71,10 83,10 75,18 83,27 71,27 71,10" fill="#F59E0B" />
        </svg>
      );
    case "NEQUI":
      return (
        <svg viewBox="0 0 40 40" className={`${h} w-auto`} aria-label="Nequi">
          <rect x="2" y="2" width="36" height="36" rx="8" fill="#F8F5F8" stroke="#ECE6EC" />
          <rect x="10" y="12" width="4" height="4" rx="1" fill="#DA0081" />
          <text x="23" y="28" textAnchor="middle" fill="#200020" fontWeight="900" fontSize="20" fontFamily="Inter, sans-serif">N</text>
        </svg>
      );
    case "BREB":
      return (
        <svg viewBox="0 0 44 40" className={`${h} w-auto`} aria-label="Bre-B">
          <rect x="2" y="2" width="40" height="36" rx="8" fill="#312E81" />
          <text x="22" y="24" textAnchor="middle" fill="#67E8F9" fontWeight="800" fontSize="11.5" fontFamily="Inter, sans-serif">Bre-B</text>
        </svg>
      );
    case "PIX":
      return (
        <svg viewBox="0 0 68 38" className={`${h} w-auto`} aria-label="Pix">
          <rect x="2" y="2" width="64" height="34" rx="7" fill="#ECFDF5" stroke="#A7F3D0" />
          <rect x="12" y="13" width="12" height="12" rx="2.5" transform="rotate(45 18 19)" fill="#0D9488" />
          <text x="45" y="24" textAnchor="middle" fill="#0F766E" fontWeight="800" fontSize="14" fontFamily="Inter, sans-serif">Pix</text>
        </svg>
      );
  }
}

export function XpagWordmark() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span>Pagamento processado por</span>
      <span className="font-extrabold italic tracking-tight text-foreground text-sm">xpag</span>
    </span>
  );
}

export function FallbackBarcode({ code }: { code: string }) {
  const bars: Array<{ x: number; w: number }> = [];
  let x = 8;
  for (let i = 0; i < code.length; i++) {
    const digit = code.charCodeAt(i);
    const w1 = (digit % 3) + 1.5;
    const g1 = ((digit >> 2) % 2) + 1.5;
    const w2 = ((digit >> 1) % 2) + 1.5;
    bars.push({ x, w: w1 });
    x += w1 + g1;
    bars.push({ x, w: w2 });
    x += w2 + 2;
  }
  const totalWidth = Math.max(x + 8, 220);
  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${totalWidth} 68`}
        className="h-20 w-full max-w-[340px]"
        role="img"
        aria-label={`Código de barras ${code}`}
      >
        {bars.map((b, idx) => (
          <rect key={idx} x={b.x} y={4} width={b.w} height={58} fill="currentColor" />
        ))}
      </svg>
      <span className="mt-1 font-mono text-xs tracking-widest text-foreground">{code}</span>
    </div>
  );
}