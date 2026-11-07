import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, ChevronDown, CircleHelp, Lock, Search, ShieldCheck, ShoppingBag, Users } from "lucide-react";
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
import { declineMessage } from "@/components/gemtop/StripeCardPaymentForm";
import { WalletPreviewStrip } from "@/components/gemtop/WalletPreviewStrip";
import diamondBonus from "@/assets/diamond-bonus.png";
import { track, trackFunnel } from "@/lib/gemtop-tracking";
import { trackTikTokPurchase } from "@/lib/tiktok-tracking";
import { rechargePackages, type RechargeKey } from "@/lib/recharge-packages";

// Same live key and same payment endpoint as the current checkout, so the
// server-side price map, retry limits and 3D Secure request still apply.
const stripePromise = loadStripe(
  "pk_live_51USd0fEMALFSqtrSvveUnWRBhIPLfzAO0SkGsntOwIRZjBZO3xJ1EHfBrVf6oZeITfSybbS72YWqJBK5WuqFjRws00VafmEWmH",
);

const COUNTRIES: [string, string][] = [
  ["US", "Estados Unidos"], ["MX", "México"], ["PR", "Puerto Rico"], ["CA", "Canadá"], ["ES", "España"],
  ["CO", "Colombia"], ["AR", "Argentina"], ["CL", "Chile"], ["PE", "Perú"], ["EC", "Ecuador"],
  ["GT", "Guatemala"], ["HN", "Honduras"], ["SV", "El Salvador"], ["DO", "República Dominicana"],
  ["VE", "Venezuela"], ["BO", "Bolivia"], ["PY", "Paraguay"], ["UY", "Uruguay"], ["PA", "Panamá"],
  ["CR", "Costa Rica"], ["NI", "Nicaragua"], ["BR", "Brasil"],
];
// Countries whose banks validate the postal code (AVS); elsewhere it is optional.
const ZIP_REQUIRED = new Set(["US", "CA", "PR"]);
// Latin American countries: banks do not check postal codes, so the field is hidden.
const ZIP_HIDDEN = new Set(["MX","CO","AR","CL","PE","EC","GT","HN","SV","DO","VE","BO","PY","UY","PA","CR","NI","BR"]);
// Countries where Shopify shows no state/province field.
const STATE_HIDDEN = new Set(["BO", "PY", "DO", "CR", "SV", "HN", "NI", "PA", "UY"]);
// Guatemala departments, same list and order as Shopify.
const GT_REGIONS: string[] = ["Alta Verapaz", "Baja Verapaz", "Chimaltenango", "Chiquimula", "El Progreso", "Escuintla", "Guatemala", "Huehuetenango", "Izabal", "Jalapa", "Jutiapa", "Petén", "Quetzaltenango", "Quiché", "Retalhuleu", "Sacatepéquez", "San Marcos", "Santa Rosa", "Sololá", "Suchitepéquez", "Totonicapán", "Zacapa"];
const TZ_COUNTRY: Record<string, string> = {
  "America/Guatemala": "GT", "America/La_Paz": "BO", "America/Costa_Rica": "CR", "America/Santo_Domingo": "DO",
  "America/Asuncion": "PY", "America/Mexico_City": "MX", "America/Monterrey": "MX", "America/Tijuana": "MX", "America/Cancun": "MX",
  "America/Merida": "MX", "America/Chihuahua": "MX", "America/Hermosillo": "MX", "America/Bogota": "CO", "America/Lima": "PE",
  "America/Guayaquil": "EC", "America/Tegucigalpa": "HN", "America/El_Salvador": "SV", "America/Managua": "NI",
  "America/Panama": "PA", "America/Caracas": "VE", "America/Montevideo": "UY", "America/Santiago": "CL",
  "America/Argentina/Buenos_Aires": "AR", "America/Puerto_Rico": "PR", "Europe/Madrid": "ES", "America/Sao_Paulo": "BR",
};
const US_STATES: [string, string][] = [
  ["AL","Alabama"],["AK","Alaska"],["AS","Samoa Americana"],["AZ","Arizona"],["AR","Arkansas"],["CA","California"],["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],["FM","Micronesia"],["FL","Florida"],["GA","Georgia"],["GU","Guam"],["HI","Hawái"],["ID","Idaho"],["IL","Illinois"],["IN","Indiana"],["IA","Iowa"],["KS","Kansas"],["KY","Kentucky"],["LA","Luisiana"],["ME","Maine"],["MH","Islas Marshall"],["MD","Maryland"],["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Misisipi"],["MO","Misuri"],["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],["NH","Nuevo Hampshire"],["NJ","Nueva Jersey"],["NM","Nuevo México"],["NY","Nueva York"],["NC","Carolina del Norte"],["ND","Dakota del Norte"],["MP","Islas Marianas del Norte"],["OH","Ohio"],["OK","Oklahoma"],["OR","Oregón"],["PW","Palaos"],["PA","Pensilvania"],["PR","Puerto Rico"],["RI","Rhode Island"],["SC","Carolina del Sur"],["SD","Dakota del Sur"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],["VT","Vermont"],["VA","Virginia"],["WA","Washington"],["DC","Washington D. C."],["WV","Virginia Occidental"],["WI","Wisconsin"],["WY","Wyoming"],["VI","Islas Vírgenes de EE. UU."],["AA","Fuerzas Armadas de las Américas"],["AE","Fuerzas Armadas de Europa"],["AP","Fuerzas Armadas del Pacífico"],
];

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
  return { src: g("src") || getUtmifyLeadId(), sck: g("sck"), utm_source: g("utm_source"), utm_medium: g("utm_medium"), utm_campaign: g("utm_campaign"), utm_content: g("utm_content"), utm_term: g("utm_term") };
}
const sourceParam = () => new URLSearchParams(window.location.search).get("utm_source") || localStorage.getItem("utm_source") || null;

type Pkg = (typeof rechargePackages)[number];

function CheckoutForm({ pkg }: { pkg: Pkg }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [newsletter, setNewsletter] = useState(true);
  const [holder, setHolder] = useState("");
  const [country, setCountry] = useState("US");
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

  const approved = async (id: string, viaServer: boolean, payer?: { email?: string; name?: string }) => {
    trackTikTokPurchase({ id, status: "succeeded", amount: pkg.priceUsd, currency: "USD", productId });
    if (!viaServer) {
      // 3D Secure confirmations finish in the browser, so register the sale here.
      fetch("/api/public/register-utmify-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, email: payer?.email || email, name: payer?.name || holder, value: pkg.priceUsd, currency: "USD", productName, leadId: getUtmifyLeadId(), sourceUrl: window.location.href, trackingParams: getUtmParams() }),
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
      body: JSON.stringify({ paymentMethodId, priceKey: pkg.key, email: payerEmail, name: payerName, phone: payerPhone || undefined, trackingParams: getUtmParams(), billingAddress: billing }),
    }).then(async (r) => ({ ok: r.ok, data: await r.json().catch(() => null) }));

  // Apple Pay / Google Pay: no address sheet, one tap with Face ID / fingerprint.
  useEffect(() => {
    if (!stripe) return;
    const pr = stripe.paymentRequest({
      country: "US",
      currency: "usd",
      total: { label: productName, amount: pkg.cents },
      requestPayerName: true,
      requestPayerEmail: true,
      requestShipping: false,
    });
    pr.canMakePayment().then((r) => { if (r) setPaymentRequest(pr); });
    pr.on("paymentmethod", async (ev) => {
      try {
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
          if (pi?.status === "succeeded") return approved(pi.id, false, { email: payerEmail, name: payerName });
          return;
        }
        ev.complete("fail");
        toast.error(data?.rate_limited ? "Demasiados intentos. Espera unos minutos e intenta de nuevo." : declineMessage("es", data?.code, data?.decline_code, data?.error) || "Tu banco no pudo procesar el pago.");
      } catch {
        ev.complete("fail");
        toast.error("No se pudo completar el pago. Intenta de nuevo.");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripe, pkg.key]);

  // Pre-select the visitor's country from the device time zone (falls back to US).
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const c = TZ_COUNTRY[tz];
      if (c) setCountry(c);
    } catch { /* keep default */ }
  }, []);
  const zipHidden = ZIP_HIDDEN.has(country);
  const zipRequired = ZIP_REQUIRED.has(country);
  const stateHidden = STATE_HIDDEN.has(country);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!isValidEmail(email)) e.email = "Ingresa un correo electrónico válido";
    if (!holder.trim()) e.holder = "Ingresa el nombre del titular";
    if (!lastName.trim()) e.lastName = "Ingresa tus apellidos";
    if (!address1.trim()) e.address1 = "Ingresa una dirección";
    if (!city.trim()) e.city = "Ingresa una ciudad";
    if (country === "US" && !state) e.state = "Selecciona un estado";
    if (country === "GT" && !state) e.state = "Selecciona una región";
    if (zipRequired && !zip.trim()) e.zip = "Ingresa un código postal";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const [cardBrand, setCardBrand] = useState<string>("unknown");
  const pay = async () => {
    if (!stripe || !elements || processing) return;
    if (!validate()) { toast.error("Revisa los campos marcados."); return; }
    const wait = lastAttempt + COOLDOWN_MS - Date.now();
    if (wait > 0) { toast.error(`Espera ${Math.ceil(wait / 1000)} segundos antes de intentar de nuevo.`); return; }
    const card = elements.getElement(CardNumberElement);
    if (!card) return;
    setProcessing(true);
    setLastAttempt(Date.now());
    const billing = { line1: address1.trim(), line2: address2.trim() || null, city: city.trim(), state: state || null, postal_code: zipHidden ? null : (zip.trim() || null), country };
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
        if (r.paymentIntent?.status === "succeeded") return approved(r.paymentIntent.id, false);
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
        <h3 className="text-sm font-bold">Dirección de facturación</h3>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1.5 text-[10px] text-muted-foreground">País / Región</span>
          <select value={country} onChange={(e) => { setCountry(e.target.value); setState(""); setErrors({}); }} autoComplete="country" className={`${field} appearance-none pt-4`}>
            {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-4 h-4 w-4 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Nombre" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={field} />
          <div><input placeholder="Apellidos" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} className={cls("lastName")} />{err("lastName")}</div>
        </div>
        <div className="relative"><input placeholder="Dirección" autoComplete="address-line1" value={address1} onChange={(e) => setAddress1(e.target.value)} className={cls("address1")} /><Search className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" />{err("address1")}</div>
        <input placeholder="Casa, apartamento, etc. (opcional)" autoComplete="address-line2" value={address2} onChange={(e) => setAddress2(e.target.value)} className={field} />
        <div className={`grid gap-3 ${[!stateHidden, !zipHidden].filter(Boolean).length === 2 ? "grid-cols-3" : [!stateHidden, !zipHidden].some(Boolean) ? "grid-cols-2" : "grid-cols-1"}`}>
          <div><input placeholder="Ciudad" autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} className={cls("city")} />{err("city")}</div>
          {!stateHidden && <div className="relative">
            {country === "US" ? (
              <>
                <select value={state} onChange={(e) => setState(e.target.value)} autoComplete="address-level1" className={`${cls("state")} appearance-none ${state ? "" : "text-muted-foreground"}`}>
                  <option value="">Estado</option>
                  {US_STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-4 h-4 w-4 text-muted-foreground" />
              </>
            ) : country === "GT" ? (
              <>
                <select value={state} onChange={(e) => setState(e.target.value)} autoComplete="address-level1" className={`${cls("state")} appearance-none ${state ? "" : "text-muted-foreground"}`}>
                  <option value="">Región</option>
                  {GT_REGIONS.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-4 h-4 w-4 text-muted-foreground" />
              </>
            ) : (
              <input placeholder="Estado / Provincia" autoComplete="address-level1" value={state} onChange={(e) => setState(e.target.value)} className={field} />
            )}
            {err("state")}
          </div>}
          {!zipHidden && <div><input placeholder={zipRequired ? "Código postal" : "Código postal (opcional)"} autoComplete="postal-code" value={zip} onChange={(e) => setZip(e.target.value)} className={cls("zip")} />{err("zip")}</div>}
        </div>
        <div className="relative"><input type="tel" placeholder="Teléfono (opcional)" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={field} /><CircleHelp className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" /></div>
      </section>

      <button
        type="button" onClick={pay} disabled={processing || !stripe}
        className="h-14 w-full rounded-md bg-success text-base font-bold text-success-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {processing ? "Procesando..." : "Pagar ahora"}
      </button>
    </div>
  );
}

export default function ShopifyStyleCheckout({ priceKey }: { priceKey: RechargeKey }) {
  const pkg = useMemo(() => rechargePackages.find((p) => p.key === priceKey) ?? rechargePackages[0], [priceKey]);
  useEffect(() => { track("checkout", `diamantes-${pkg.key}`, sourceParam()); }, [pkg.key]);
  const price = `$${pkg.priceUsd.toFixed(2)}`;

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
            <Elements stripe={stripePromise}><CheckoutForm pkg={pkg} /></Elements>
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
        <span><span className="mr-2 text-xs text-muted-foreground">USD</span><span className="text-lg font-bold">{price}</span></span>
      </div>
    </>
  );
}
