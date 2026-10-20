import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useFunnelTracking } from "@/hooks/useFunnelTracking";
import freefireLogoAsset from "@/assets/freefire-logo-transparent.png.asset.json";

export const Route = createFileRoute("/roleta")({
  head: () => ({
    meta: [
      { title: "Roleta Free Fire — Gira y gana tu descuento" },
      { name: "description", content: "Gira la roleta y gana hasta 65% de descuento en diamantes de Free Fire." },
      { property: "og:title", content: "Roleta Free Fire — Gira y gana tu descuento" },
      { property: "og:description", content: "Gira la roleta y gana hasta 65% de descuento en diamantes de Free Fire." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Roleta Free Fire — Gira y gana tu descuento" },
      { name: "twitter:description", content: "Gira la roleta y gana hasta 65% de descuento en diamantes de Free Fire." },
    ],
  }),
  component: RoletaPage,
});

type Segment = {
  label: string;
  kind: "none" | "35" | "65";
  fill: string;
  text: string;
};

// 4 casas sin premio + 2 con 35% + 2 con 65%
const SEGMENTS: Segment[] = [
  { label: "35% OFF", kind: "35", fill: "#7c2d12", text: "#fed7aa" },
  { label: "SIN PREMIO", kind: "none", fill: "#18181f", text: "#8a8a97" },
  { label: "65% OFF", kind: "65", fill: "#ea580c", text: "#0a0a0c" },
  { label: "SIN PREMIO", kind: "none", fill: "#18181f", text: "#8a8a97" },
  { label: "35% OFF", kind: "35", fill: "#7c2d12", text: "#fed7aa" },
  { label: "SIN PREMIO", kind: "none", fill: "#18181f", text: "#8a8a97" },
];

// Índice de la casa donde cae cada giro (fijo según la dinámica pedida)
const FIRST_SPIN = 1; // SIN PREMIO
const SECOND_SPIN = 2; // 65% OFF

const SEG_ANGLE = 360 / SEGMENTS.length;

function polar(cx: number, cy: number, r: number, angleFromTopDeg: number) {
  const rad = (angleFromTopDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

function segmentPath(i: number) {
  const cx = 100;
  const cy = 100;
  const r = 96;
  const start = i * SEG_ANGLE;
  const end = (i + 1) * SEG_ANGLE;
  const p1 = polar(cx, cy, r, start);
  const p2 = polar(cx, cy, r, end);
  return `M ${cx} ${cy} L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r} ${r} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} Z`;
}

type Phase = "idle" | "first" | "lost" | "second" | "won";

function RoletaPage() {
  useFunnelTracking("roleta");
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("idle");
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);

  const preserveSearch = () =>
    typeof window !== "undefined" && window.location.search
      ? Object.fromEntries(new URLSearchParams(window.location.search).entries())
      : undefined;

  const spinTo = (segmentIndex: number, next: Phase) => {
    const mid = segmentIndex * SEG_ANGLE + SEG_ANGLE / 2;
    const jitter = Math.random() * (SEG_ANGLE - 24) - (SEG_ANGLE - 24) / 2;
    let target = 360 * 6 + (360 - mid) + jitter;
    while (target <= rotationRef.current + 720) target += 360;
    rotationRef.current = target;
    setRotation(target);
    setPhase(next);
  };

  const handleSpin = () => {
    if (phase === "idle") spinTo(FIRST_SPIN, "first");
    else if (phase === "lost") spinTo(SECOND_SPIN, "second");
  };

  const handleSpinEnd = () => {
    if (phase === "first") setPhase("lost");
    else if (phase === "second") setPhase("won");
  };

  const spinning = phase === "first" || phase === "second";

  return (
    <div className="min-h-screen gamer-bg relative overflow-hidden">
      <style>{`
        @keyframes roleta-confetti {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes roleta-prize-pop {
          0% { transform: scale(0.4); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes roleta-diamond-float {
          0%, 100% { transform: translateY(0) rotate(-6deg); }
          50% { transform: translateY(-10px) rotate(6deg); }
        }
        @keyframes roleta-ambient {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.06); }
        }
        @keyframes roleta-ring-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes roleta-bulb {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px 2px rgba(255,122,20,0.8); }
          50% { opacity: 0.25; box-shadow: 0 0 2px 0 rgba(255,122,20,0.3); }
        }
        @keyframes roleta-pointer-wiggle {
          0%, 100% { transform: translateX(-50%) rotate(0deg); }
          25% { transform: translateX(-50%) rotate(-10deg); }
          75% { transform: translateX(-50%) rotate(10deg); }
        }
        @keyframes roleta-screen-flash {
          0% { opacity: 0; }
          15% { opacity: 0.85; }
          100% { opacity: 0; }
        }
        @keyframes roleta-shine-sweep {
          0% { transform: translateX(-120%) skewX(-18deg); }
          100% { transform: translateX(240%) skewX(-18deg); }
        }
        @keyframes roleta-win-glow {
          0%, 100% { box-shadow: 0 0 24px rgba(255,122,20,0.45), inset 0 0 18px rgba(255,122,20,0.12); }
          50% { box-shadow: 0 0 48px rgba(255,122,20,0.75), inset 0 0 30px rgba(255,122,20,0.22); }
        }
      `}</style>

      {/* Flash de tela al ganar */}
      {phase === "won" && (
        <div
          className="fixed inset-0 z-40 pointer-events-none bg-primary"
          style={{ animation: "roleta-screen-flash 0.7s ease-out forwards" }}
        />
      )}

      <main className="container py-6 sm:py-10 relative z-10">
        <div className="max-w-md mx-auto text-center">
          {/* Logo Free Fire (igual que la página del quiz) */}
          <div className="flex justify-center mb-6 -mx-4">
            <img
              src={freefireLogoAsset.url}
              alt="Free Fire Logo"
              className="w-full max-w-md h-auto object-contain drop-shadow-[0_0_18px_rgba(255,122,20,0.55)]"
            />
          </div>

          <p className="font-display uppercase tracking-[0.3em] text-xs text-primary mb-2">
            Roleta de descuentos
          </p>
          <h1 className="font-display uppercase tracking-wider text-2xl sm:text-3xl font-bold text-foreground">
            ¡Gira y gana tu descuento!
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Tienes 1 giro gratis. Puede tocar hasta <span className="text-primary font-semibold">65% OFF</span> en diamantes.
          </p>

          {/* Roleta */}
          <div className="relative mx-auto mt-8 w-[300px] h-[300px] sm:w-[340px] sm:h-[340px]">
            {/* Resplandor ambiente detrás de la rueda */}
            <div
              className="absolute -inset-8 rounded-full bg-primary/25 blur-2xl pointer-events-none"
              style={{ animation: "roleta-ambient 3s ease-in-out infinite" }}
            />
            {/* Halo giratorio estilo neón */}
            <div
              className={`absolute -inset-3 rounded-full pointer-events-none transition-opacity duration-500 ${
                spinning ? "opacity-100" : "opacity-60"
              }`}
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0%, rgba(255,122,20,0.55) 12%, transparent 25%, transparent 50%, rgba(255,187,64,0.45) 62%, transparent 75%)",
                filter: "blur(10px)",
                animation: "roleta-ring-spin 6s linear infinite",
              }}
            />

            {/* Bombillas del aro */}
            {Array.from({ length: 16 }).map((_, i) => {
              const pos = polar(50, 50, 49, i * (360 / 16));
              return (
                <span
                  key={i}
                  className="absolute w-[5px] h-[5px] rounded-full bg-primary z-10"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: "translate(-50%, -50%)",
                    animation: `roleta-bulb 1.4s ease-in-out ${(i % 2) * 0.7}s infinite`,
                  }}
                />
              );
            })}

            {/* Puntero */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-4 z-20">
              <div
                className={`w-0 h-0 border-l-[15px] border-r-[15px] border-t-[28px] border-l-transparent border-r-transparent border-t-primary drop-shadow-[0_2px_8px_rgba(255,122,20,0.9)] ${
                  spinning ? "" : "transition-transform"
                }`}
                style={spinning ? { animation: "roleta-pointer-wiggle 0.28s ease-in-out infinite" } : undefined}
              />
            </div>

            {/* Aro exterior */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-b from-primary/40 to-primary/10 p-[6px] transition-shadow duration-500"
              style={{
                boxShadow: spinning
                  ? "0 0 45px rgba(255,122,20,0.65), inset 0 0 20px rgba(255,122,20,0.3)"
                  : "0 0 24px rgba(255,122,20,0.35)",
              }}
            >
              <div className="w-full h-full rounded-full bg-background p-[3px] border border-border">
                <svg
                  viewBox="0 0 200 200"
                  className="w-full h-full rounded-full"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning
                      ? "transform 4.5s cubic-bezier(0.12, 0.8, 0.15, 1)"
                      : "none",
                  }}
                  onTransitionEnd={handleSpinEnd}
                >
                  {SEGMENTS.map((seg, i) => {
                    const mid = i * SEG_ANGLE + SEG_ANGLE / 2;
                    const labelPos = polar(100, 100, 62, mid);
                    return (
                      <g key={i}>
                        <path d={segmentPath(i)} fill={seg.fill} stroke="#0a0a0c" strokeWidth="1.5" />
                        <text
                          x={labelPos.x}
                          y={labelPos.y}
                          fill={seg.text}
                          fontSize="10.5"
                          fontWeight="700"
                          fontFamily="Rajdhani, sans-serif"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${mid} ${labelPos.x} ${labelPos.y})`}
                        >
                          {seg.label}
                        </text>
                      </g>
                    );
                  })}
                  {/* Centro */}
                  <circle cx="100" cy="100" r="22" fill="#0a0a0c" stroke="#ea580c" strokeWidth="3" />
                  <g transform="translate(100 100)">
                    <path
                      d="M -9 -5 L -4.5 -10 L 4.5 -10 L 9 -5 L 0 10 Z"
                      fill="#ea580c"
                      stroke="#fed7aa"
                      strokeWidth="1"
                    />
                  </g>
                </svg>
              </div>
            </div>

            {/* Chispas sobre la rueda mientras gira */}
            {spinning && (
              <>
                {[
                  { left: "8%", top: "20%", delay: "0s" },
                  { left: "85%", top: "15%", delay: "0.3s" },
                  { left: "15%", top: "75%", delay: "0.5s" },
                  { left: "90%", top: "70%", delay: "0.8s" },
                ].map((s, i) => (
                  <span
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full bg-primary/90 pointer-events-none z-10"
                    style={{
                      left: s.left,
                      top: s.top,
                      boxShadow: "0 0 8px 3px rgba(255,122,20,0.7)",
                      animation: `roleta-diamond-float 1.1s ease-in-out ${s.delay} infinite`,
                    }}
                  />
                ))}
              </>
            )}
          </div>

          {/* Mensaje + botones */}
          <div className="mt-8 min-h-[120px]">
            {phase === "idle" && (
              <button
                onClick={handleSpin}
                className="font-display uppercase tracking-widest text-base sm:text-lg font-bold py-3.5 px-10 rounded-xl bg-gradient-to-r from-primary to-orange-400 text-primary-foreground shadow-[0_8px_24px_rgba(255,122,20,0.35)] hover:brightness-110 active:scale-[0.98] transition-all duration-200 animate-pulse-glow"
              >
                Girar ahora
              </button>
            )}

            {phase === "lost" && (
              <div className="animate-fade-in">
                <p className="text-sm text-muted-foreground">
                  Casi… esta vez no tocó premio. ¡Tienes un giro más!
                </p>
                <button
                  onClick={handleSpin}
                  className="mt-4 font-display uppercase tracking-widest text-base sm:text-lg font-bold py-3.5 px-10 rounded-xl bg-gradient-to-r from-primary to-orange-400 text-primary-foreground shadow-[0_8px_24px_rgba(255,122,20,0.35)] hover:brightness-110 active:scale-[0.98] transition-all duration-200 animate-pulse-glow"
                >
                  Girar de nuevo
                </button>
              </div>
            )}

            {(phase === "first" || phase === "second") && (
              <p className="font-display uppercase tracking-widest text-sm text-muted-foreground animate-fade-in">
                Girando…
              </p>
            )}

            {phase === "won" && (
              <div className="animate-fade-in">
                <div
                  className="relative bg-card border border-primary/50 rounded-2xl p-6 overflow-hidden"
                  style={{
                    animation: "roleta-prize-pop 0.6s ease-out forwards, roleta-win-glow 1.8s ease-in-out 0.6s infinite",
                  }}
                >
                  {/* Barrido de brillo sobre la tarjeta */}
                  <span
                    className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-primary/25 to-transparent pointer-events-none"
                    style={{ animation: "roleta-shine-sweep 2.2s ease-in-out 0.8s infinite" }}
                  />

                  {/* Confeti dentro de la tarjeta */}
                  {Array.from({ length: 24 }).map((_, i) => (
                    <span
                      key={i}
                      className="absolute top-0 w-1.5 h-3 rounded-sm pointer-events-none"
                      style={{
                        left: `${(i * 37) % 100}%`,
                        backgroundColor: ["#ea580c", "#fbbf24", "#22c55e", "#f97316"][i % 4],
                        animation: `roleta-confetti ${1.8 + (i % 5) * 0.4}s linear ${(i % 7) * 0.15}s infinite`,
                      }}
                    />
                  ))}

                  <div
                    className="mx-auto mb-2 w-14 h-14 rounded-full bg-primary/10 border border-primary/40 flex items-center justify-center"
                    style={{ animation: "roleta-diamond-float 1.6s ease-in-out infinite" }}
                  >
                    <svg viewBox="-12 -14 24 28" className="w-7 h-7">
                      <path
                        d="M -9 -5 L -4.5 -10 L 4.5 -10 L 9 -5 L 0 10 Z"
                        fill="#ea580c"
                        stroke="#fed7aa"
                        strokeWidth="1"
                      />
                    </svg>
                  </div>
                  <p className="font-display uppercase tracking-[0.25em] text-xs text-primary">
                    ¡Premio desbloqueado!
                  </p>
                  <h2 className="font-display uppercase tracking-wider text-3xl sm:text-4xl font-bold text-foreground mt-1 drop-shadow-[0_0_12px_rgba(255,122,20,0.6)]">
                    65% OFF
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    En tu recarga de diamantes. Descuento aplicado al continuar.
                  </p>
                  <button
                    onClick={() => navigate({ to: "/idplayer", search: preserveSearch() })}
                    className="mt-5 w-full font-display uppercase tracking-widest text-base sm:text-lg font-bold py-3.5 px-6 rounded-xl bg-gradient-to-r from-primary to-orange-400 text-primary-foreground shadow-[0_8px_24px_rgba(255,122,20,0.45)] hover:brightness-110 active:scale-[0.98] transition-all duration-200 animate-pulse-glow"
                  >
                    Rescatar descuento →
                  </button>
                </div>

                {/* Confeti de pantalla completa */}
                <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <span
                      key={i}
                      className="absolute top-0 rounded-sm"
                      style={{
                        left: `${(i * 61) % 100}%`,
                        width: i % 3 === 0 ? "8px" : "5px",
                        height: i % 3 === 0 ? "14px" : "10px",
                        backgroundColor: ["#ea580c", "#fbbf24", "#22c55e", "#f97316", "#fde68a"][i % 5],
                        animation: `roleta-confetti ${2.2 + (i % 6) * 0.5}s linear ${(i % 9) * 0.22}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
