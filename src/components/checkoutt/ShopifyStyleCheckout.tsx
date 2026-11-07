import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, Lock, ShieldCheck, ShoppingBag, Users } from "lucide-react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import StripeCardPaymentForm from "@/components/gemtop/StripeCardPaymentForm";
import diamondBonus from "@/assets/diamond-bonus.png";
import { track, trackFunnel } from "@/lib/gemtop-tracking";
import { rechargePackages, type RechargeKey } from "@/lib/recharge-packages";

// Same live key as the current checkout: payment rules, retry limits,
// 3D Secure and decline messages all live in StripeCardPaymentForm.
const stripePromise = loadStripe(
  "pk_live_51USd0fEMALFSqtrSvveUnWRBhIPLfzAO0SkGsntOwIRZjBZO3xJ1EHfBrVf6oZeITfSybbS72YWqJBK5WuqFjRws00VafmEWmH",
);

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export default function ShopifyStyleCheckout({ priceKey }: { priceKey: RechargeKey }) {
  const pkg = rechargePackages.find((p) => p.key === priceKey) ?? rechargePackages[0];
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [emailError, setEmailError] = useState("");
  const [dadosTracked, setDadosTracked] = useState(false);

  const source = () =>
    new URLSearchParams(window.location.search).get("utm_source") || localStorage.getItem("utm_source") || null;

  useEffect(() => {
    track("checkout", `diamantes-${pkg.key}`, source());
  }, [pkg.key]);

  const onEmail = (v: string) => {
    setEmail(v);
    if (!dadosTracked && v) {
      trackFunnel("dados", { productId: `diamantes-${pkg.key}`, source: source() });
      setDadosTracked(true);
    }
    if (emailError && isValidEmail(v)) setEmailError("");
  };

  const checkEmail = () =>
    setEmailError(!email.trim() ? "El correo electrónico es obligatorio" : !isValidEmail(email) ? "Ingresa un correo electrónico válido" : "");

  const price = `$${pkg.priceUsd.toFixed(2)}`;

  return (
    <div className="checkout-light min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
          <span className="w-5" />
          <div className="flex items-center gap-3 text-xs font-bold leading-tight">
            <span className="flex items-center gap-1 text-primary">
              <ShieldCheck className="h-7 w-7" />
              <span>COMPRA<br />SEGURA</span>
            </span>
            <span className="h-8 w-px bg-border" />
            <span className="flex items-center gap-1">
              <Users className="h-6 w-6" />
              <span><span className="text-primary">+ DE 1500</span><br />CLIENTES</span>
            </span>
          </div>
          <ShoppingBag className="h-5 w-5 text-primary" />
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl md:grid-cols-[1fr_minmax(0,420px)]">
        {/* Order summary (top on mobile, right on desktop) */}
        <aside className="order-first bg-muted px-4 py-6 md:order-last md:min-h-screen md:px-8 md:py-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={diamondBonus} alt="Bono de Diamantes" className="h-12 w-12 rounded-lg border border-border bg-card object-cover" />
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">1</span>
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium">Bono de Diamantes</p>
              <p className="text-xs text-muted-foreground">{pkg.diamonds} + {pkg.bonus} Bonus</p>
            </div>
            <span className="text-sm">{price}</span>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span><span className="mr-2 text-xs text-muted-foreground">USD</span><span className="text-lg font-bold">{price}</span></span>
          </div>
        </aside>

        <main className="px-4 py-8 md:px-10">
          <section className="space-y-3">
            <h2 className="text-lg font-bold">Contacto</h2>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => onEmail(e.target.value)}
              onBlur={checkEmail}
              className={`h-12 w-full rounded-md border bg-card px-3 text-sm outline-none focus:border-primary ${emailError ? "border-destructive" : "border-border"}`}
            />
            {emailError && (
              <p className="flex items-center gap-1 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{emailError}</p>
            )}
            <input
              type="text"
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-primary"
            />
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-bold">Pago</h2>
            <p className="mb-3 flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" />Todas las transacciones son seguras y están encriptadas.</p>
            <div className="rounded-md border border-primary bg-card p-4">
              <Elements stripe={stripePromise}>
                <StripeCardPaymentForm
                  priceKey={pkg.key}
                  amount={pkg.priceUsd}
                  onSuccess={() => navigate({ to: "/obrigado" })}
                  productName={`${pkg.diamonds} Diamantes Free Fire`}
                  customerEmail={email.trim()}
                  customerName={name}
                  lang="es"
                  onEmailInvalid={checkEmail}
                />
              </Elements>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
