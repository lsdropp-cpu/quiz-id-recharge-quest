import { useState, useEffect, useMemo, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Lock, Sparkles } from "lucide-react";
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFunnelTracking } from "@/hooks/useFunnelTracking";
import { resolveTracking } from "@/lib/tracking";
import SocialProofToasts from "@/components/SocialProofToasts";
import LiveViewersBadge from "@/components/LiveViewersBadge";
import membershipsBanner from "@/assets/memberships-banner.webp";
import diamondIcon from "@/assets/diamond-icon.png";

const BUMP_PRICE_USD = 2.99;

const countries = [
  { code: "MX", flag: "🇲🇽", name: "México" },
  { code: "US", flag: "🇺🇸", name: "Estados Unidos" },
  { code: "CA", flag: "🇨🇦", name: "Canadá" },
  { code: "GT", flag: "🇬🇹", name: "Guatemala" },
  { code: "SV", flag: "🇸🇻", name: "El Salvador" },
  { code: "HN", flag: "🇭🇳", name: "Honduras" },
  { code: "NI", flag: "🇳🇮", name: "Nicaragua" },
  { code: "CR", flag: "🇨🇷", name: "Costa Rica" },
  { code: "PA", flag: "🇵🇦", name: "Panamá" },
  { code: "DO", flag: "🇩🇴", name: "República Dominicana" },
  { code: "PR", flag: "🇵🇷", name: "Puerto Rico" },
  { code: "AR", flag: "🇦🇷", name: "Argentina" },
  { code: "BO", flag: "🇧🇴", name: "Bolivia" },
  { code: "BR", flag: "🇧🇷", name: "Brasil" },
  { code: "CL", flag: "🇨🇱", name: "Chile" },
  { code: "CO", flag: "🇨🇴", name: "Colombia" },
  { code: "EC", flag: "🇪🇨", name: "Ecuador" },
  { code: "PY", flag: "🇵🇾", name: "Paraguay" },
  { code: "PE", flag: "🇵🇪", name: "Perú" },
  { code: "UY", flag: "🇺🇾", name: "Uruguay" },
  { code: "VE", flag: "🇻🇪", name: "Venezuela" },
  { code: "ES", flag: "🇪🇸", name: "España" },
  { code: "PT", flag: "🇵🇹", name: "Portugal" },
  { code: "DE", flag: "🇩🇪", name: "Alemania" },
  { code: "FR", flag: "🇫🇷", name: "Francia" },
  { code: "IT", flag: "🇮🇹", name: "Italia" },
  { code: "GB", flag: "🇬🇧", name: "Reino Unido" },
];



const plans = [
  { id: 1, diamonds: "5.600", bonus: "1.120", total: "6.720", price: "9.90", badge: "MEJOR VALOR", badgeGradient: "from-violet-500 to-fuchsia-500" },
  { id: 2, diamonds: "11.200", bonus: "2.240", total: "13.440", price: "15.90", badge: "MÁS POPULAR", badgeGradient: "from-orange-500 to-pink-500" },
  { id: 3, diamonds: "22.400", bonus: "4.480", total: "26.880", price: "19.90", badge: "MEJOR OFERTA", badgeGradient: "from-violet-500 to-fuchsia-500" },
  { id: 4, diamonds: "29.500", bonus: "5.900", total: "35.400", price: "25.90", badge: "MÁXIMO BENEFICIO", badgeGradient: "from-violet-500 to-fuchsia-500" },
];

export const Route = createFileRoute("/checkout/$planId")({
  head: () => ({ meta: [
    { title: "Checkout — Recarga Free Fire" },
    { name: "description", content: "Completa los datos de pago de tu recarga Free Fire." },
    { property: "og:title", content: "Checkout — Recarga Free Fire" },
    { property: "og:description", content: "Completa los datos de pago de tu recarga Free Fire." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: CheckoutPage,
});

type CreatePIArgs = { isExpress: boolean };

type PaymentSectionProps = {
  displayPrice: string;
  planId: number;
  email: string;
  name: string;
  country: string;
  bumpSelected: boolean;
  formValid: boolean;
};

const PaymentSection = ({
  displayPrice,
  planId,
  email,
  name,
  country,
  bumpSelected,
  formValid,
}: PaymentSectionProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create the PaymentIntent only when the user actually attempts to pay.
  // This dramatically reduces "Incompleto" PaymentIntents in Stripe.
  const createPaymentIntent = async (
    overrideEmail?: string,
    overrideName?: string,
  ): Promise<{ clientSecret: string; paymentIntentId: string } | null> => {
    const searchParams = new URLSearchParams(window.location.search);
    const tracking = resolveTracking(searchParams);
    const { data, error } = await supabase.functions.invoke("create-payment-intent", {
      body: {
        planId,
        email: (overrideEmail ?? email).trim(),
        name: (overrideName ?? name).trim(),
        country,
        bumpSelected,
        tracking,
      },
    });
    if (error) throw error;
    if (!data?.clientSecret || !data?.paymentIntentId) {
      throw new Error("Respuesta inválida del servidor");
    }
    return { clientSecret: data.clientSecret, paymentIntentId: data.paymentIntentId };
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (!formValid) {
      setErrorMsg("Completa tu correo y nombre antes de pagar");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMsg(submitError.message ?? "Revisa los datos de pago");
        setSubmitting(false);
        return;
      }
      const pi = await createPaymentIntent();
      if (!pi) {
        setSubmitting(false);
        return;
      }
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret: pi.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout-success?payment_intent=${pi.paymentIntentId}`,
          payment_method_data: {
            billing_details: { email, name },
          },
        },
      });
      if (error) {
        setErrorMsg(error.message ?? "Error al confirmar el pago");
        setSubmitting(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al iniciar el pago";
      setErrorMsg(msg);
      setSubmitting(false);
    }
  };

  const handleExpressConfirm = async (event: { billingDetails?: { email?: string | null; name?: string | null } | null }) => {
    if (!stripe || !elements) return;
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const expressEmail = event?.billingDetails?.email || email;
      const expressName = event?.billingDetails?.name || name || "Cliente";
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMsg(submitError.message ?? "Revisa los datos de pago");
        setSubmitting(false);
        return;
      }
      const pi = await createPaymentIntent(expressEmail, expressName);
      if (!pi) {
        setSubmitting(false);
        return;
      }
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret: pi.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout-success?payment_intent=${pi.paymentIntentId}`,
        },
      });
      if (error) {
        setErrorMsg(error.message ?? "Error al confirmar el pago");
        setSubmitting(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al iniciar el pago";
      setErrorMsg(msg);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-5">
      <div>
        <ExpressCheckoutElement
          onConfirm={handleExpressConfirm}
          options={{
            buttonHeight: 48,
            paymentMethods: {
              applePay: "auto",
              googlePay: "auto",
              link: "auto",
              amazonPay: "never",
              paypal: "never",
            },
          }}
        />
      </div>

      <div className="relative flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex-1 h-px bg-border" />
        <span className="uppercase tracking-wide">o paga con tarjeta</span>
        <span className="flex-1 h-px bg-border" />
      </div>

      <PaymentElement
        options={{
          layout: "tabs",
          fields: {
            billingDetails: { email: "never", name: "never" },
          },
        }}
      />

      {errorMsg && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
          {errorMsg}
        </p>
      )}

      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Lock className="w-4 h-4" />
        <span>Pago 100% seguro procesado por Stripe</span>
      </div>

      <button
        type="submit"
        disabled={!stripe || submitting || !formValid}
        className="w-full text-lg font-semibold py-4 px-6 rounded-xl bg-gradient-to-b from-success to-success/80 text-success-foreground shadow-lg shadow-success/30 hover:brightness-110 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "Procesando..." : `PAGAR $${displayPrice} USD`}
      </button>
    </form>
  );
};

function CheckoutPage() {
  useFunnelTracking("checkout");
  const { planId } = Route.useParams();
  const plan = plans.find((p) => p.id === Number(planId)) || plans[0];

  const [timeLeft, setTimeLeft] = useState(600);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("México");
  const [bumpSelected, setBumpSelected] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const basePriceNumber = parseFloat(plan.price);
  const totalNumber = basePriceNumber + (bumpSelected ? BUMP_PRICE_USD : 0);
  const totalCents = Math.round(totalNumber * 100);
  const displayPrice = totalNumber.toFixed(2);

  const [stripePromise, setStripePromise] = useState<Promise<StripeJs | null> | null>(null);
  const stripeInitRef = useRef(false);

  // Detect country from IP for prefill
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) return;
        const data = await res.json();
        const code = (data?.country_code || data?.country || "").toUpperCase();
        if (cancelled || !code) return;
        const match = countries.find((c) => c.code === code);
        if (match) setCountry(match.name);
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formValid = email.trim().length > 3 && name.trim().length > 1;

  // Load Stripe.js once with just the publishable key — no PaymentIntent yet.
  // The PI is created only when the user actually clicks Pay or an Express
  // Checkout button (Apple Pay / Google Pay / Link).
  useEffect(() => {
    if (stripeInitRef.current) return;
    stripeInitRef.current = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("stripe-config");
        if (error) throw error;
        if (!data?.publishableKey) throw new Error("Falta configuración de pago");
        setStripePromise(loadStripe(data.publishableKey));
      } catch (err) {
        stripeInitRef.current = false;
        const msg = err instanceof Error ? err.message : "Error al iniciar el pago";
        setInitError(msg);
        toast.error(msg);
      }
    })();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Deferred-intent mode: amount + currency drive Express Checkout / Payment
  // Element without creating a PaymentIntent. Updating amount re-renders
  // ExpressCheckoutElement (e.g. when the bump is toggled).
  const elementsOptions = useMemo(
    () => ({
      mode: "payment" as const,
      amount: totalCents,
      currency: "usd",
      paymentMethodCreation: "manual" as const,
      appearance: {
        theme: "stripe" as const,
        variables: {
          colorPrimary: "hsl(142 71% 45%)",
          borderRadius: "12px",
        },
      },
    }),
    [totalCents],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-destructive text-destructive-foreground py-2.5 sm:py-3 sticky top-0 z-30">
        <div className="container flex items-center justify-center gap-2 sm:gap-3">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-xl sm:text-3xl font-bold font-mono leading-none">{formatTime(timeLeft)}</span>
          <span className="font-medium text-xs sm:text-base">PROMOCIÓN SOLO HOY</span>
        </div>
      </div>

      <main className="container py-4 sm:py-6 md:py-10">
        <div className="max-w-lg mx-auto">
          <img src={membershipsBanner} alt="Membresías Free Fire" className="w-full rounded-xl mb-4 sm:mb-6 shadow-md" />
          <LiveViewersBadge className="mb-3 sm:mb-4" />

          <div className="bg-card rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <div className={`inline-block bg-gradient-to-r ${plan.badgeGradient} text-white text-[10px] sm:text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-3`}>
              {plan.badge}
            </div>
            <div className="flex items-start gap-3 sm:gap-4">
              <img src={diamondIcon} alt="Diamantes" className="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0" />
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-foreground leading-tight">Diamantes — Free Fire</h2>
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs sm:text-sm mt-1">
                  <span>{plan.diamonds} Diamantes</span>
                </div>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">+ {plan.bonus} Diamantes bonus</p>
                {bumpSelected && (
                  <p className="text-success text-xs sm:text-sm font-medium mt-1">+ 1,000 diamantes extras 🎁</p>
                )}
                <p className="text-success font-bold text-base sm:text-lg mt-1">Total: $ {displayPrice} USD</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-lg p-4 sm:p-6 space-y-5 sm:space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm sm:text-base font-semibold text-foreground">Tus datos</h3>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tu correo electrónico
                </label>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ingresa tu correo"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nombre completo</label>
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ingresa tu nombre"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">País</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {countries.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-border pt-5 sm:pt-6">
              <h3 className="text-sm sm:text-base font-semibold text-foreground mb-3 sm:mb-4">Forma de pago</h3>

              {initError && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                  {initError}
                </p>
              )}

              {!stripePromise && !initError && (
                <div className="space-y-3 animate-pulse">
                  <div className="h-12 rounded-xl bg-muted" />
                  <div className="h-12 rounded-xl bg-muted" />
                  <div className="h-12 rounded-xl bg-muted" />
                </div>
              )}

              {stripePromise && (
                <Elements stripe={stripePromise} options={elementsOptions}>
                  <PaymentSection
                    displayPrice={displayPrice}
                    planId={plan.id}
                    email={email}
                    name={name}
                    country={country}
                    bumpSelected={bumpSelected}
                    formValid={formValid}
                  />
                </Elements>
              )}
            </div>

            <button
              type="button"
              onClick={() => setBumpSelected((v) => !v)}
              className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                bumpSelected
                  ? "border-success bg-success/10 shadow-md"
                  : "border-dashed border-warning/60 bg-warning/5 hover:border-warning"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                    bumpSelected ? "bg-success border-success" : "border-warning"
                  }`}
                >
                  {bumpSelected && (
                    <svg viewBox="0 0 16 16" className="w-3 h-3 text-success-foreground">
                      <path
                        fill="currentColor"
                        d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-warning" />
                    <p className="text-sm font-bold text-foreground">¡SÍ! Quiero +1,000 diamantes extras</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Solo por{" "}
                    <span className="font-bold text-foreground">+US$ {BUMP_PRICE_USD.toFixed(2)}</span> —
                    agregado a esta misma compra. Oferta única, no se repite después del pago.
                  </p>
                </div>
              </div>
            </button>
          </div>

        </div>
      </main>

      <SocialProofToasts />
    </div>
  );
}
