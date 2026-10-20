import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Copy, Loader2, ShieldCheck, Timer, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GarenaHeader from "@/components/br/GarenaHeader";
import diamondIcon from "@/assets/diamond-icon.png";
import { useFunnelTracking } from "@/hooks/useFunnelTracking";
import { resolveTracking } from "@/lib/tracking";
import { brPackages, formatBRL } from "@/lib/br-packages";
import { createPixOrder, getPixOrderStatus } from "@/lib/pix.functions";

export const Route = createFileRoute("/br/checkout/$plan")({
  head: () => ({
    meta: [
      { title: "Pagamento via PIX — Recarga Free Fire Brasil" },
      { name: "description", content: "Finalize sua recarga de diamantes com pagamento instantâneo via PIX." },
      { property: "og:title", content: "Pagamento via PIX — Recarga Free Fire Brasil" },
      { property: "og:description", content: "Finalize sua recarga de diamantes com pagamento instantâneo via PIX." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CheckoutPage,
});

const onlyDigits = (v: string) => v.replace(/\D/g, "");
const maskCpf = (v: string) =>
  onlyDigits(v).slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
const maskPhone = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
};

function CheckoutPage() {
  useFunnelTracking("checkout");
  const { plan } = Route.useParams();
  const idx = Math.min(Math.max(parseInt(plan, 10) || 0, 0), brPackages.length - 1);
  const pkg = brPackages[idx];

  const createFn = useServerFn(createPixOrder);
  const statusFn = useServerFn(getPixOrderStatus);

  const [form, setForm] = useState({ name: "", email: "", cpf: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pix, setPix] = useState<{ orderId: string; qrCode: string } | null>(null);
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);

  useEffect(() => {
    if (!pix || paid) return;
    const tick = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    const poll = setInterval(async () => {
      try {
        const r = await statusFn({ data: { orderId: pix.orderId } });
        if (r.status === "paid") setPaid(true);
      } catch { /* keep polling */ }
    }, 12000);
    return () => { clearInterval(tick); clearInterval(poll); };
  }, [pix, paid, statusFn]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cpf = onlyDigits(form.cpf);
    const phone = onlyDigits(form.phone);
    if (form.name.trim().length < 3) return setError("Digite seu nome completo.");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Digite um e-mail válido.");
    if (cpf.length !== 11) return setError("Digite um CPF válido.");
    if (phone.length < 10) return setError("Digite um celular válido com DDD.");
    setLoading(true);
    try {
      let playerId: string | undefined;
      try { playerId = sessionStorage.getItem("br_player_id") ?? undefined; } catch { /* ignore */ }
      const tracking = resolveTracking(new URLSearchParams(window.location.search));
      const r = await createFn({ data: { plan: idx, name: form.name, email: form.email.trim(), cpf, phone, playerId, tracking } });
      setPix({ orderId: r.orderId, qrCode: r.qrCode });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error && err.message.length < 120 ? err.message : "Não foi possível gerar o PIX. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!pix) return;
    try { await navigator.clipboard.writeText(pix.qrCode); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div lang="pt-BR" className="min-h-screen gamer-bg">
      <main className="container py-4 sm:py-6 md:py-10">
        <div className="max-w-lg mx-auto">
          <GarenaHeader />

          {/* Order summary */}
          <div className="bg-card rounded-2xl shadow-lg p-4 sm:p-5 mb-3 border border-primary/30">
            <div className="flex items-center gap-3">
              <img src={diamondIcon} alt="" className="w-12 h-12 object-contain" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">{pkg.badge}</p>
                <p className="font-display font-bold text-foreground text-lg leading-tight">{pkg.diamonds} Diamantes</p>
                <p className="text-xs text-primary font-semibold">+ {pkg.bonus} Diamantes de bônus</p>
              </div>
              <p className="font-display text-primary font-extrabold text-2xl">{formatBRL(pkg.cents)}</p>
            </div>
            {!pix && (
              <Link to="/br/recharge" search={(p: Record<string, unknown>) => p} className="block text-center text-xs text-muted-foreground mt-3 underline">
                Trocar pacote
              </Link>
            )}
          </div>

          {paid ? (
            <div className="bg-card rounded-2xl shadow-lg p-6 text-center border-2 border-success">
              <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-3" />
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">Pagamento aprovado!</h2>
              <p className="text-sm text-muted-foreground">
                Seus diamantes serão creditados na sua conta de Free Fire em instantes. Obrigado pela compra!
              </p>
            </div>
          ) : pix ? (
            <div className="bg-card rounded-2xl shadow-lg p-4 sm:p-6 text-center">
              <h2 className="font-display text-xl font-bold text-foreground mb-1">Pague com PIX</h2>
              <p className="text-sm text-muted-foreground mb-3">Escaneie o QR Code ou copie o código abaixo no app do seu banco.</p>
              <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/30 rounded-full px-3 py-1 text-primary text-sm font-bold mb-4">
                <Timer className="w-4 h-4" /> Expira em {mm}:{ss}
              </div>
              <div className="bg-background rounded-xl p-3 inline-block mb-4 border border-border">
                <QRCodeSVG value={pix.qrCode} size={200} marginSize={2} className="rounded-lg" />
              </div>
              <div className="bg-muted/50 border border-border rounded-xl p-3 text-xs text-muted-foreground break-all text-left mb-3 max-h-20 overflow-hidden">
                {pix.qrCode}
              </div>
              <Button onClick={copy} className="w-full h-14 text-base font-bold rounded-xl">
                {copied ? <><CheckCircle2 className="w-5 h-5" /> Código copiado!</> : <><Copy className="w-5 h-5" /> Copiar código PIX</>}
              </Button>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Aguardando pagamento... a confirmação é automática.
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="bg-card rounded-2xl shadow-lg p-4 sm:p-6 space-y-3">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                <h2 className="text-base sm:text-lg font-bold text-foreground">Seus dados</h2>
              </div>
              <Input placeholder="Nome completo" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-12" />
              <Input placeholder="E-mail" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12" />
              <Input placeholder="CPF" inputMode="numeric" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: maskCpf(e.target.value) })} className="h-12" />
              <Input placeholder="Celular com DDD" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} className="h-12" />
              {error && <p className="text-sm text-destructive font-medium">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full h-14 text-base font-bold rounded-xl">
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Gerando PIX...</> : <><Zap className="w-5 h-5" /> Gerar PIX — {formatBRL(pkg.cents)}</>}
              </Button>
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-success" /> Pagamento 100% seguro · Aprovação imediata
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
