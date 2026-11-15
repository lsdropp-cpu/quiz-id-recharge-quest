import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, CircleHelp, Lock, ShieldCheck, ShoppingBag, Users } from "lucide-react";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  PaymentRequestButtonElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type PaymentRequest } from "@stripe/stripe-js";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { getLocalQuote } from "@/lib/local-currency.functions";
import { formatLocalPrice, type LocalQuote } from "@/lib/local-currency";
import { declineMessage } from "@/components/gemtop/StripeCardPaymentForm";
import { WalletPreviewStrip } from "@/components/gemtop/WalletPreviewStrip";
import diamondBonus from "@/assets/diamond-bonus.png";
import { track, trackFunnel } from "@/lib/gemtop-tracking";
import { trackTikTokPurchase } from "@/lib/tiktok-tracking";
import { type RechargeKey } from "@/lib/recharge-packages";
import { Button } from "@/components/ui/button";
import { billingCountries as COUNTRIES, billingAddress, validateBilling, postalCodeRequired, regionRequired } from "@/lib/checkout-billing";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { stripeCheckoutPackage, type CheckoutCurrency } from "@/lib/stripe-checkout-packages";

// Same live key and same payment endpoint as the current checkout, so the
// server-side price map, retry limits and 3D Secure request still apply.
const stripePromise = loadStripe(
  "pk_live_51USd0fEMALFSqtrSvveUnWRBhIPLfzAO0SkGsntOwIRZjBZO3xJ1EHfBrVf6oZeITfSybbS72YWqJBK5WuqFjRws00VafmEWmH",
);

const TZ_COUNTRY: Record<string, string> = {
  "America/Guatemala": "GT", "America/La_Paz": "BO", "America/Costa_Rica": "CR", "America/Santo_Domingo": "DO",
  "America/Asuncion": "PY", "America/Mexico_City": "MX", "America/Monterrey": "MX", "America/Tijuana": "MX", "America/Cancun": "MX",
  "America/Merida": "MX", "America/Chihuahua": "MX", "America/Hermosillo": "MX", "America/Bogota": "CO", "America/Lima": "PE",
  "America/Guayaquil": "EC", "America/Tegucigalpa": "HN", "America/El_Salvador": "SV", "America/Managua": "NI",
  "America/Panama": "PA", "America/Caracas": "VE", "America/Montevideo": "UY", "America/Santiago": "CL",
  "America/Argentina/Buenos_Aires": "AR", "America/Puerto_Rico": "PR", "Europe/Madrid": "ES", "America/Sao_Paulo": "BR",
};
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
const COOLDOWN_MS = 10_000;

const stripeStyle = {
  base: { fontSize: "14px", color: "#1a1a1a", fontFamily: "system-ui, -apple-system, sans-serif", "::placeholder": { color: "#737373" } },
  invalid: { color: "#dc2626" },
};

const field = "h-12 w-full rounded-md border border-border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary";
const stripeBox = "flex h-12 items-center rounded-md border border-border bg-card px-3";

function getUtmifyLeadId(): string {
  try {
    const raw = localStorage.getItem("utmify_lead") || localStorage.getItem("utmify_pixel_data");
    if (raw) { const p = JSON.parse(raw); return p._id || p.leadId || ""; }
  } catch { /* ignore */ }
  return "";
}
function getUtmParams() {
  const url = new URLSearchParams(window.location.search);
  const g = (k: string) => url.get(k) || localStorage.getItem(`utm_${k}`) || localStorage.getItem(k) || "";
  return { src: g("src") || getUtmifyLeadId(), sck: g("sck"), utm_source: g("utm_source"), utm_medium: g("utm_medium"), utm_campaign: g("utm_campaign"), utm_content: g("utm_content"), utm_term: g("utm_term"), utm_id: g("utm_id") };
}
const sourceParam = () => new URLSearchParams(window.location.search).get("utm_source") || localStorage.getItem("utm_source") || null;

type Pkg = Omit<ReturnType<typeof stripeCheckoutPackage>, "currency"> & { currency: string };

function CheckoutForm({ pkg, country, setCountry, quote, quoteLoading, quoteError, retryQuote }: { pkg: Pkg; country: string; setCountry: (country: string) => void; quote: LocalQuote | null; quoteLoading: boolean; quoteError: string | null; retryQuote: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [newsletter, setNewsletter] = useState(true);
  const [holder, setHolder] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [lastAttempt, setLastAttempt] = useState(0);
  const [dadosTracked, setDadosTracked] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  // Visual-only wallet mockup for the Lovable preview (or ?vercarteiras=1);
  // real customers always see the live Stripe buttons or nothing.
  const [showWalletPreview, setShowWalletPreview] = useState(false);
  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get("vercarteiras") === "1";
    setShowWalletPreview(Boolean(import.meta.env.DEV) || forced);
  }, []);

  const productName = `${pkg.diamonds} Diamantes Free Fire`;
  const productId = `diamantes-${pkg.key}`;

  const approved = async (id: string, viaServer: boolean, payer?: { email?: string; name?: string }, clientSecret?: string) => {
    trackTikTokPurchase({ id, status: "succeeded", amount: pkg.priceAmount, currency: pkg.currency, productId });
    if (!viaServer && clientSecret) {
      // 3D Secure confirmations finish in the browser, so register the sale here.
      fetch("/api/public/register-utmify-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({ orderId: id, clientSecret, email: payer?.email || email, name: payer?.name || holder, value: pkg.priceAmount, currency: pkg.currency, productName, leadId: getUtmifyLeadId(), sourceUrl: window.location.href, trackingParams: getUtmParams() }),
      }).catch(() => {});
    }
    trackFunnel("comprou", { productId, source: sourceParam() });
    toast.success("¡Pago realizado con éxito!");
    navigate({ to: "/obrigado" });
  };

  const callServer = (paymentMethodId: string, payerEmail: string, payerName: string, billing: Record<string, string | null>, payerPhone?: string) =>
    fetch("/api/public/process-card-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethodId, priceKey: pkg.key, checkoutMode: "local", quoteToken: quote?.token, email: payerEmail, name: payerName, phone: payerPhone || undefined, trackingParams: getUtmParams(), billingAddress: billing }),
    }).then(async (r) => ({ ok: r.ok, data: await r.json().catch(() => null) }));

  // Apple Pay / Google Pay: no address sheet, one tap with Face ID / fingerprint.
  useEffect(() => {
    setPaymentRequest(null);
    if (!stripe || !quote || quoteLoading || quote.expiresAt <= Date.now()) return;
    const pr = stripe.paymentRequest({
      country: "US",
      currency: pkg.currency.toLowerCase(),
      total: { label: productName, amount: pkg.cents },
      requestPayerName: true,
      requestPayerEmail: true,
      requestShipping: false,
    });
    let active = true;
    pr.canMakePayment().then((r) => { if (r && active) setPaymentRequest(pr); }).catch(() => {});
    pr.on("paymentmethod", async (ev) => {
      try {
        if (quote.expiresAt <= Date.now()) { ev.complete("fail"); retryQuote(); toast.error("El precio expiró. Revisa el total actualizado antes de pagar."); return; }
        const b = ev.paymentMethod.billing_details;
        const payerEmail = ev.payerEmail || b.email || "";
        const payerName = ev.payerName || b.name || "";
        const { data } = await callServer(ev.paymentMethod.id, payerEmail, payerName, {
          line1: b.address?.line1 || null, line2: b.address?.line2 || null, city: b.address?.city || null,
          state: b.address?.state || null, postal_code: b.address?.postal_code || null, country: b.address?.country || null,
        }, ev.payerPhone || b.phone || undefined);
        if (data?.success) { ev.complete("success"); return approved(data.paymentIntentId, true, { email: payerEmail, name: payerName }); }
        if (data?.requires_action && data.client_secret) {
          const { error, paymentIntent } = await stripe.confirmCardPayment(data.client_secret, { payment_method: ev.paymentMethod.id }, { handleActions: false });
          if (error) { ev.complete("fail"); toast.error(declineMessage("es", error.code, error.decline_code, error.message) || "Tu banco rechazó la transacción."); return; }
          ev.complete("success");
          let pi = paymentIntent;
          if (pi?.status === "requires_action") { const r = await stripe.confirmCardPayment(data.client_secret); if (r.error) { toast.error(declineMessage("es", r.error.code, r.error.decline_code, r.error.message) || "No se completó la verificación de tu banco."); return; } pi = r.paymentIntent; }
          if (pi?.status === "succeeded") return approved(pi.id, false, { email: payerEmail, name: payerName }, data.client_secret);
          return;
        }
        ev.complete("fail");
        toast.error(data?.rate_limited ? "Demasiados intentos. Espera unos minutos e intenta de nuevo." : declineMessage("es", data?.code, data?.decline_code, data?.error) || "Tu banco no pudo procesar el pago.");
      } catch {
        ev.complete("fail");
        toast.error("No se pudo completar el pago. Intenta de nuevo.");
      }
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripe, quote?.token, quoteLoading]);

  const billingValues = { country, firstName, lastName, address1, address2, city, state, zip, phone };
  const zipRequired = postalCodeRequired(country);
  const stateRequired = regionRequired(country);

  const validate = () => {
    const e: Record<string, string> = validateBilling(billingValues);
    if (!isValidEmail(email)) e.email = "Ingresa un correo electrónico válido";
    if (!holder.trim()) e.holder = "Ingresa el nombre del titular";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const [cardBrand, setCardBrand] = useState<string>("unknown");
  const pay = async () => {
    if (!stripe || !elements || processing || quoteLoading || !quote) return;
    if (quote.expiresAt <= Date.now()) { retryQuote(); toast.error("El precio expiró. Revisa el total actualizado antes de pagar."); return; }
    if (!validate()) { toast.error("Revisa los campos marcados."); return; }
    const wait = lastAttempt + COOLDOWN_MS - Date.now();
    if (wait > 0) { toast.error(`Espera ${Math.ceil(wait / 1000)} segundos antes de intentar de nuevo.`); return; }
    const card = elements.getElement(CardNumberElement);
    if (!card) return;
    setProcessing(true);
    setLastAttempt(Date.now());
    const billing = billingAddress(billingValues);
    const fullName = `${firstName} ${lastName}`.trim() || holder;
    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card,
        billing_details: { name: holder.trim(), email: email.trim(), phone: phone.trim() || undefined, address: { ...billing, line2: billing.line2 ?? undefined, state: billing.state ?? undefined, postal_code: billing.postal_code ?? undefined } },
      });
      if (error || !paymentMethod) { toast.error(declineMessage("es", error?.code, error?.decline_code, error?.message) || "Revisa los datos de tu tarjeta."); return; }
      const { data } = await callServer(paymentMethod.id, email.trim(), fullName, billing, phone.trim());
      if (data?.success) return approved(data.paymentIntentId, true);
      if (data?.requires_action && data.client_secret) {
        const r = await stripe.confirmCardPayment(data.client_secret);
        if (r.error) { toast.error(declineMessage("es", r.error.code, r.error.decline_code, r.error.message) || "No se completó la verificación de tu banco."); return; }
        if (r.paymentIntent?.status === "succeeded") return approved(r.paymentIntent.id, false, undefined, data.client_secret);
        return;
      }
      toast.error(data?.rate_limited ? "Demasiados intentos. Espera unos minutos e intenta de nuevo." : declineMessage("es", data?.code, data?.decline_code, data?.error) || "Tu banco no pudo procesar el pago.");
    } catch {
      toast.error("No se pudo completar el pago. Intenta de nuevo.");
    } finally {
      setProcessing(false);
    }
  };

  const err = (k: string) => errors[k] && <p className="mt-1 flex items-center gap-1 text-xs text-destructive"><AlertCircle className="h-3 w-3" />{errors[k]}</p>;
  const cls = (k: string) => `${field} ${errors[k] ? "border-destructive" : ""}`;

  return (
    <div className="space-y-8">
      <div aria-live="polite" className="text-sm">
        {quoteLoading ? <p className="text-muted-foreground">Actualizando precio...</p> : quoteError ? <div className="flex items-center gap-3 text-destructive"><p>{quoteError}</p><Button variant="outline" onClick={retryQuote}>Reintentar</Button></div> : quote?.fallback && <p className="text-xs text-muted-foreground">La moneda local no está disponible. El pago se realizará en USD.</p>}
      </div>
      {/* Express checkout */}
      {(paymentRequest || showWalletPreview) && (
        <section>
          <p className="mb-2 text-center text-xs text-muted-foreground">Pago exprés</p>
          {paymentRequest ? (
            <PaymentRequestButtonElement options={{ paymentRequest, style: { paymentRequestButton: { type: "buy", theme: "dark", height: "44px" } } }} />
          ) : (
            <WalletPreviewStrip lang="es" />
          )}
          <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />O<span className="h-px flex-1 bg-border" /></div>
        </section>
      )}

      {/* Contact */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Contacto</h2>
        <div className="relative">
          <input
            type="email" autoComplete="email" placeholder="Correo electrónico" value={email} className={cls("email")}
            onChange={(e) => {
              setEmail(e.target.value);
              if (!dadosTracked && e.target.value) { trackFunnel("dados", { productId, source: sourceParam() }); setDadosTracked(true); }
            }}
          />
          <CircleHelp className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" />
          {err("email")}
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} className="h-4 w-4 accent-primary" />
          Enviarme novedades y ofertas por correo electrónico
        </label>
      </section>

      {/* Payment */}
      <section>
        <h2 className="text-lg font-bold">Pago</h2>
        <p className="mb-3 text-xs text-muted-foreground">Todas las transacciones son seguras y están encriptadas.</p>
        <div className="overflow-hidden rounded-md border border-primary">
          <div className="flex items-center justify-between bg-primary/10 px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <span className="flex h-4 w-4 items-center justify-center rounded-full border-4 border-primary bg-card" />
              Tarjeta de crédito
            </span>
            <span className="flex gap-1 text-[9px] font-bold">
              {([["visa","VISA"],["mastercard","MC"],["amex","AMEX"],["other","+5"]] as const).map(([k, b]) => { const on = cardBrand !== "unknown" && (k === cardBrand || (k === "other" && !["visa","mastercard","amex"].includes(cardBrand))); return <span key={b} className={`rounded border px-1.5 py-0.5 transition-opacity ${on ? "border-primary bg-card" : "border-border bg-card"} ${cardBrand !== "unknown" && !on ? "opacity-30" : ""}`}>{b}</span>; })}
            </span>
          </div>
          <div className="space-y-3 bg-muted p-4">
            <div className={`${stripeBox} justify-between`}><div className="flex-1"><CardNumberElement options={{ style: stripeStyle, placeholder: "Número de tarjeta", showIcon: true }} onChange={(e) => setCardBrand(e.brand || "unknown")} /></div><Lock className="h-4 w-4 text-muted-foreground" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className={stripeBox}><div className="flex-1"><CardExpiryElement options={{ style: stripeStyle, placeholder: "Vencimiento (MM / AA)" }} /></div></div>
              <div className={`${stripeBox} justify-between`}><div className="flex-1"><CardCvcElement options={{ style: stripeStyle, placeholder: "Código de seguridad" }} /></div><CircleHelp className="h-4 w-4 text-muted-foreground" /></div>
            </div>
            <div><input placeholder="Nombre del titular" autoComplete="cc-name" value={holder} onChange={(e) => setHolder(e.target.value)} className={cls("holder")} />{err("holder")}</div>
          </div>
        </div>
      </section>

      {/* Billing address */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Dirección de facturación</h2>
        <label htmlFor="billing-country" className="block text-sm font-medium">País de facturación</label>
        <Select value={country} onValueChange={(value) => { setCountry(value); setState(""); setZip(""); setErrors({}); }} disabled={processing} autoComplete="country">
          <SelectTrigger id="billing-country" className={`${field} shadow-none`}>
            <SelectValue placeholder="Selecciona tu país" />
          </SelectTrigger>
          <SelectContent className="checkout-light max-h-72">
            {COUNTRIES.map(([code, name]) => (
              <SelectItem key={code} value={code} textValue={name}>
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true" className="inline-flex w-6 shrink-0 justify-center text-lg">
                    {String.fromCodePoint(...Array.from(code, (letter) => 127397 + letter.charCodeAt(0)))}
                  </span>
                  <span>{name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {err("country")}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><input aria-label="Nombre" placeholder="Nombre" autoComplete="billing given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={processing} className={cls("firstName")} />{err("firstName")}</div>
          <div><input aria-label="Apellidos" placeholder="Apellidos" autoComplete="billing family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={processing} className={cls("lastName")} />{err("lastName")}</div>
        </div>
        <div><input aria-label="Dirección" placeholder="Dirección" autoComplete="billing address-line1" value={address1} onChange={(e) => setAddress1(e.target.value)} disabled={processing} className={cls("address1")} />{err("address1")}</div>
        <input aria-label="Apartamento, casa, etc. (opcional)" placeholder="Apartamento, casa, etc. (opcional)" autoComplete="billing address-line2" value={address2} onChange={(e) => setAddress2(e.target.value)} disabled={processing} className={field} />
        <div><input aria-label="Ciudad" placeholder="Ciudad" autoComplete="billing address-level2" value={city} onChange={(e) => setCity(e.target.value)} disabled={processing} className={cls("city")} />{err("city")}</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><input aria-label="Estado o provincia" placeholder={`Estado o provincia${stateRequired ? "" : " (opcional)"}`} autoComplete="billing address-level1" value={state} onChange={(e) => setState(e.target.value)} disabled={processing} className={cls("state")} />{err("state")}</div>
          <div><input aria-label="Código postal" placeholder={`Código postal${zipRequired ? "" : " (opcional)"}`} autoComplete="billing postal-code" value={zip} onChange={(e) => setZip(e.target.value)} disabled={processing} className={cls("zip")} />{err("zip")}</div>
        </div>
        <input type="tel" aria-label="Teléfono (opcional)" placeholder="Teléfono (opcional)" autoComplete="billing tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={processing} className={field} />
      </section>

      <Button
        type="button" onClick={pay} disabled={processing || !stripe || quoteLoading || !quote}
        className="h-14 w-full rounded-md bg-success text-base font-bold text-success-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {processing ? "Procesando..." : "Pagar ahora"}
      </Button>
    </div>
  );
}

function timezoneCountry() {
  try { return TZ_COUNTRY[Intl.DateTimeFormat().resolvedOptions().timeZone] || undefined; } catch { return undefined; }
}

const quoteCache = new Map<string, LocalQuote>();

export default function UploadedStripeCheckout({ priceKey, currency = "USD" }: { priceKey: RechargeKey; currency?: CheckoutCurrency }) {
  const basePkg = useMemo(() => stripeCheckoutPackage(priceKey, currency), [priceKey, currency]);
  const [country, setCountryState] = useState<string | null>(null);
  const setCountry = (value: string) => { setQuote(null); setQuoteLoading(true); setCountryState(value); };
  const [quote, setQuote] = useState<LocalQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteRetry, setQuoteRetry] = useState(0);
  const requestQuote = useServerFn(getLocalQuote);
  useEffect(() => {
    let active = true;
    const cacheKey = `${priceKey}:${country ?? "auto"}`;
    const hit = quoteCache.get(cacheKey);
    if (hit && hit.expiresAt > Date.now() + 60_000 && quoteRetry === 0) {
      setQuote(hit); setQuoteError(null); setQuoteLoading(false);
      if (!country) setCountryState(hit.country);
      return;
    }
    setQuoteLoading(true); setQuoteError(null);
    requestQuote({ data: { key: priceKey, country: country ?? undefined, timezoneCountry: timezoneCountry() } }).then((result) => {
      if (!active) return;
      if (result.quote) {
        quoteCache.set(`${priceKey}:${result.quote.country}`, result.quote);
        if (!country) { quoteCache.set(cacheKey, result.quote); setCountryState(result.quote.country); }
      }
      setQuote(result.quote); setQuoteError(result.error); setQuoteLoading(false);
    }).catch(() => { if (active) { setQuoteError("No se pudo obtener el precio. Intenta de nuevo."); setQuoteLoading(false); } });
    return () => { active = false; };
  }, [priceKey, country, quoteRetry]);
  useEffect(() => {
    if (!quote) return;
    const timer = setTimeout(() => { setQuote(null); setQuoteLoading(true); setQuoteRetry((value) => value + 1); }, Math.max(0, quote.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [quote]);
  const pkg = quote ? { ...basePkg, currency: quote.currency, cents: quote.amount, priceAmount: quote.priceAmount } : basePkg;
  useEffect(() => { track("checkout", `diamantes-${pkg.key}`, sourceParam()); }, [pkg.key]);
  const price = quoteLoading ? "Actualizando..." : quote ? formatLocalPrice(quote.amount, quote.currency) : "—";

  return (
    <div className="checkout-light min-h-screen bg-card text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
          <span className="w-5" />
          <div className="flex items-center gap-3 text-xs font-bold leading-tight">
            <span className="flex items-center gap-1 text-primary"><ShieldCheck className="h-7 w-7" /><span>COMPRA<br />SEGURA</span></span>
            <span className="h-8 w-px bg-border" />
            <span className="flex items-center gap-1"><Users className="h-6 w-6" /><span><span className="text-primary">+ DE 1500</span><br />CLIENTES</span></span>
          </div>
          <ShoppingBag className="h-5 w-5 text-primary" />
        </div>
      </header>

      <div className="md:flex md:min-h-[calc(100vh-73px)]">
        <div className="md:flex md:flex-1 md:justify-end md:border-r md:border-border">
          <aside className="bg-muted px-4 py-5 md:hidden">
            <Summary pkg={pkg} price={price} />
          </aside>
          <main className="w-full max-w-[560px] px-4 py-8 md:px-10">
            <Elements stripe={stripePromise}><CheckoutForm key={priceKey} pkg={pkg} country={country ?? quote?.country ?? "US"} setCountry={setCountry} quote={quote} quoteLoading={quoteLoading} quoteError={quoteError} retryQuote={() => setQuoteRetry((value) => value + 1)} /></Elements>
          </main>
        </div>
        <div className="hidden bg-muted md:block md:flex-1">
          <aside className="sticky top-0 max-w-[420px] px-10 py-10"><Summary pkg={pkg} price={price} /></aside>
        </div>
      </div>
    </div>
  );
}

function Summary({ pkg, price }: { pkg: Pkg; price: string }) {
  return (
    <>
      <div className="flex items-center gap-3">
        <div className="relative">
          <img src={diamondBonus} alt="Bono de Diamantes" className="h-12 w-12 rounded-lg border border-border bg-card object-cover" />
          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">1</span>
        </div>
        <div className="flex-1 text-sm"><p className="font-medium">Bono de Diamantes</p><p className="text-xs text-muted-foreground">{pkg.diamonds} + {pkg.bonus} Bonus</p></div>
        <span className="text-sm">{price}</span>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <span className="font-semibold">Total</span>
        <span><span className="mr-2 text-xs text-muted-foreground">{pkg.currency}</span><span className="text-lg font-bold">{price}</span></span>
      </div>
    </>
  );
}
