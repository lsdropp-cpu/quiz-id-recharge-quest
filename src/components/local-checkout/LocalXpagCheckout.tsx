import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Check, ChevronLeft, Info, Loader2, Lock } from "lucide-react";
import diamondBonus from "@/assets/diamond-bonus.png";
import { Button } from "@/components/ui/button";
import { rechargePackage, type RechargeKey } from "@/lib/recharge-packages";
import {
  formatLocalAmount,
  getLocalMethod,
  getOfferedLocalMethods,
  localCustomerSchema,
  type LocalCheckoutOptions,
  type LocalMethodId,
  type XpagChargeInstruction,
} from "@/lib/xpag";
import { createLocalXpagCharge, getLocalCheckoutOptions } from "@/lib/xpag.functions";
import ChargeConfirmationStep from "./ChargeConfirmationStep";
import { MethodLogo, XpagWordmark } from "./MethodBadges";

type Step = 1 | 2 | 3;

const STEP_LABELS: Array<{ step: Step; label: string }> = [
  { step: 1, label: "Tus datos" },
  { step: 2, label: "Pago" },
  { step: 3, label: "Confirmación" },
];

export default function LocalXpagCheckout({ priceKey }: { priceKey: RechargeKey }) {
  const loadOptionsFn = useServerFn(getLocalCheckoutOptions);
  const createChargeFn = useServerFn(createLocalXpagCharge);

  const pack = useMemo(() => rechargePackage(priceKey), [priceKey]);
  const [step, setStep] = useState<Step>(1);
  const [options, setOptions] = useState<LocalCheckoutOptions | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string }>({});
  const [selectedMethod, setSelectedMethod] = useState<LocalMethodId>("OXXO");
  const [submitting, setSubmitting] = useState(false);
  const [chargeError, setChargeError] = useState<string | null>(null);
  const [charge, setCharge] = useState<XpagChargeInstruction | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingOptions(true);
    void loadOptionsFn({ data: { priceKey } }).then((res) => {
      if (cancelled) return;
      if (res.options) {
        setOptions(res.options);
        const firstEnabled = getOfferedLocalMethods(res.options.enabledCurrencies)[0];
        if (firstEnabled) setSelectedMethod(firstEnabled.id);
      }
      setOptionsError(res.error);
      setLoadingOptions(false);
    }).catch(() => { if (!cancelled) { setOptionsError("No se pudieron cargar los métodos de pago. Actualiza la página."); setLoadingOptions(false); } });
    return () => {
      cancelled = true;
    };
  }, [priceKey, loadOptionsFn]);

  const availableMethods = useMemo(
    () => getOfferedLocalMethods(options?.enabledCurrencies),
    [options],
  );

  const activeMeta = getLocalMethod(selectedMethod);
  const activeQuote = options?.quotes[selectedMethod];

  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = localCustomerSchema.safeParse({ name, email });
    if (!parsed.success) {
      const nextErrors: { name?: string; email?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "name" && !nextErrors.name) nextErrors.name = issue.message;
        if (key === "email" && !nextErrors.email) nextErrors.email = issue.message;
      }
      setFieldErrors(nextErrors);
      return;
    }
    setFieldErrors({});
    setChargeError(null);
    setStep(2);
  };

  const handleCreateCharge = async () => {
    setSubmitting(true);
    setChargeError(null);
    try {
    const res = await createChargeFn({
      data: {
        priceKey,
        method: selectedMethod,
        name: name.trim(),
        email: email.trim(),
        quoteToken: activeQuote?.token ?? "",
      },
    });
    setSubmitting(false);
    if (res.error || !res.charge) {
      setChargeError(res.error ?? "No se pudo generar el pago en este momento.");
      return;
    }
    setCharge(res.charge);
    setStep(3);
    } catch { setChargeError("No se pudo generar el pago. Inténtalo de nuevo."); }
    finally { setSubmitting(false); }
  };

  const summaryAmount = charge
    ? formatLocalAmount(charge.amount, charge.currency)
    : activeQuote
      ? formatLocalAmount(activeQuote.amount, activeQuote.currency)
      : "Calculando...";

  return (
    <div className="local-checkout-surface min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        {/* Stepper */}
        <nav aria-label="Pasos del pago" className="mb-8 flex items-center justify-center gap-2 sm:gap-4">
          {STEP_LABELS.map((item, idx) => {
            const completed = step > item.step;
            const current = step === item.step;
            return (
              <div key={item.step} className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      completed
                        ? "border border-success/40 bg-success/10 text-success"
                        : current
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {completed ? <Check className="h-3.5 w-3.5" /> : item.step}
                  </span>
                  <span
                    className={`text-xs sm:text-sm ${
                      current || completed ? "font-semibold text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                {idx < STEP_LABELS.length - 1 && (
                  <div className="hidden h-px w-14 bg-border sm:block md:w-24" />
                )}
              </div>
            );
          })}
        </nav>

        {/* Main 2-column grid */}
        <div className={step === 1 ? "mx-auto max-w-xl" : "grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.35fr_0.9fr]"}>
          {/* Left card */}
          <section className="rounded-lg border border-border/70 bg-card p-6 shadow-sm sm:p-8">
            {step === 1 && (
              <form action="/local" onSubmit={handleContinueToPayment} noValidate className="space-y-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h1 className="text-xl font-bold text-foreground">Tus datos</h1>
                  <p className="text-xs text-muted-foreground">
                    Los usamos para generar el cobro y enviar el comprobante.
                  </p>
                </div>

                {optionsError && <p role="alert" className="text-sm text-destructive">{optionsError}</p>}
                <div className="space-y-1.5">
                  <label htmlFor="local-name" className="block text-sm font-semibold text-foreground">
                    Nombre completo <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="local-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors(({ name: _name, ...rest }) => rest);
                    }}
                    placeholder="Como aparece en tu documento"
                    className="w-full rounded-lg border border-input bg-muted/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none"
                  />
                  {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="local-email" className="block text-sm font-semibold text-foreground">
                    Correo electrónico <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="local-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors(({ email: _email, ...rest }) => rest);
                    }}
                    placeholder="tu@ejemplo.com"
                    className="w-full rounded-lg border border-input bg-muted/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none"
                  />
                  {fieldErrors.email ? (
                    <p className="text-xs text-destructive">{fieldErrors.email}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      El comprobante de la compra llega a este correo.
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Continuar al pago
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h1 className="text-xl font-bold text-foreground">Cómo quieres pagar</h1>
                  <Button
                    type="button"
                    onClick={() => {
                      setChargeError(null);
                      setStep(1);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Volver a tus datos
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {availableMethods.map((method) => {
                    const quote = options?.quotes[method.id];
                    const active = selectedMethod === method.id;
                    return (
                      <Button
                        key={method.id}
                        type="button"
                        onClick={() => {
                          setSelectedMethod(method.id);
                          setChargeError(null);
                        }}
                        className={`relative flex h-auto min-h-32 flex-col items-center justify-center rounded-lg px-3 py-5 text-center transition-all ${
                          active
                            ? "border-2 border-primary bg-card shadow-xs"
                            : "border border-border bg-muted/35 hover:border-foreground/30 hover:bg-card"
                        }`}
                      >
                        {active && (
                          <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                        <div className="mb-2.5 flex h-10 items-center justify-center">
                          <MethodLogo method={method.id} />
                        </div>
                        <span className="text-sm font-bold text-foreground">{method.label}</span>
                        <span className="mt-1 text-xs font-medium text-muted-foreground">
                          {loadingOptions || !quote
                            ? "Calculando..."
                            : formatLocalAmount(quote.amount, quote.currency)}
                        </span>
                      </Button>
                    );
                  })}
                </div>

                <div className="flex items-start gap-2.5 rounded-lg bg-muted/65 px-4 py-3 text-xs text-muted-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{activeMeta.helperText}</span>
                </div>

                {activeQuote && activeQuote.expiresAt <= Date.now() && <p role="alert" className="text-sm text-destructive">Cotización expirada. Actualiza la página para continuar.</p>}
                {chargeError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive"
                  >
                    {chargeError}
                  </div>
                )}

                <Button
                  type="button"
                  disabled={submitting || loadingOptions || !activeQuote || activeQuote.expiresAt <= Date.now()}
                  onClick={() => void handleCreateCharge()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generando pago...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Pagar {summaryAmount}
                    </>
                  )}
                </Button>
              </div>
            )}

            {step === 3 && charge && (
              <ChargeConfirmationStep
                charge={charge}
                onUpdateCharge={setCharge}
                onBack={() => {
                  setCharge(null);
                  setStep(2);
                }}
              />
            )}
          </section>

          {/* Right card: Resumo do pedido */}
          {step !== 1 && <aside className="rounded-lg border border-border/70 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-2 pb-4">
              <h2 className="text-base font-bold text-foreground">Resumen del pedido</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2.5 py-1 text-[11px] font-semibold text-success">
                <Lock className="h-3 w-3" />
                Conexión segura
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={diamondBonus}
                  alt={options?.productTitle ?? `${pack.diamonds} Diamantes`}
                  className="h-12 w-12 shrink-0 rounded-lg border border-border bg-card object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">
                    {options?.productTitle ?? `${pack.diamonds} Diamantes`}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {options?.productSubtitle ?? `+ ${pack.bonus} Bono · Free Fire`}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-sm font-bold text-foreground">
                {summaryAmount}
              </span>
            </div>

            <div className="space-y-2 border-b border-dashed border-border py-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-foreground">{summaryAmount}</span>
              </div>
            </div>

            <div className="border-b border-border py-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-bold text-foreground">Total</span>
                <span className="text-2xl font-extrabold tracking-normal text-foreground">
                  {summaryAmount}
                </span>
              </div>
              {(charge || activeQuote) && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {getLocalMethod(charge?.method ?? selectedMethod).label} · {charge?.currency ?? activeQuote?.currency}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-4">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Aceptamos
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {availableMethods.map((m) => (
                  <MethodLogo key={m.id} method={m.id} compact />
                ))}
              </div>
            </div>
          </aside>}
        </div>

        <footer className="mt-8 flex justify-center">
          <XpagWordmark />
        </footer>
      </div>
    </div>
  );
}