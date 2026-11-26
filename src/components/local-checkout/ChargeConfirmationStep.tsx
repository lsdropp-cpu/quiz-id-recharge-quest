import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, CheckCircle2, ChevronLeft, Clock, Copy, ExternalLink, Hourglass, Info, Loader2, XCircle } from "lucide-react";
import { checkLocalXpagStatus } from "@/lib/xpag.functions";
import {
  formatLocalAmount,
  getLocalMethod,
  type XpagChargeInstruction,
} from "@/lib/xpag";
import { Button } from "@/components/ui/button";
import PaymentBarcode from './PaymentBarcode';
import { trackMetaPurchase } from '@/lib/meta-pixel';
import { QRCodeSVG } from 'qrcode.react';

type Props = {
  charge: XpagChargeInstruction;
  onUpdateCharge: (next: XpagChargeInstruction) => void;
  onBack: () => void;
};

export default function ChargeConfirmationStep({ charge, onUpdateCharge, onBack }: Props) {
  const checkStatusFn = useServerFn(checkLocalXpagStatus);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [barcodeError, setBarcodeError] = useState(false);
  const meta = getLocalMethod(charge.method);

  const isPaid = charge.status === "confirmed" || charge.status === "completed";
  const isFailed = charge.status === "failed" || charge.status === "expired";

  useEffect(() => {
    if (isPaid) trackMetaPurchase(charge);
  }, [isPaid, charge.requestNumber, charge.status, charge.amount, charge.currency]);

  useEffect(() => {
    if (isPaid || isFailed) return;
    let active = true;
    const poll = async () => {
      try {
      const res = await checkStatusFn({
        data: {
          statusToken: charge.statusToken,
        },
      });
      if (active && res.charge) {
        onUpdateCharge({ ...charge, ...res.charge });
      }
      } catch { /* Keep pending state if the status service is unavailable. */ }
    };
    const timer = window.setInterval(() => { void poll(); }, charge.awaitingInstruction ? 2500 : 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [charge.requestNumber, charge.status, charge.awaitingInstruction, isPaid, isFailed, checkStatusFn, onUpdateCharge]);

  const copyText = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Clipboard API unavailable
    }
  };

  const primaryCopyCode = charge.copyPaste ?? charge.reference ?? charge.clabe;
  const copyLabel =
    charge.method === "SPEI"
      ? "CLABE INTERBANCARIA"
      : charge.method === "OXXO"
        ? "REFERENCIA DE PAGO"
        : "CÓDIGO COPIA Y PEGA";

  const formattedAmount = formatLocalAmount(charge.amount, charge.currency);

  if (isPaid) {
    return (
      <div className="space-y-6 text-center py-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground">¡Pago confirmado!</h2>
          <p className="text-sm text-muted-foreground">
            Recibimos {formattedAmount} vía {meta.label}. Pago recibido por XPag.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          Referencia del pedido: <span className="font-mono font-medium text-foreground">{charge.requestNumber}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Button
        variant="ghost"
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Por pagar</p>
          <p className="text-2xl font-extrabold tracking-normal text-foreground sm:text-3xl">
            {formattedAmount}
          </p>
        </div>
        {isFailed ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive">
            <XCircle className="h-3.5 w-3.5" />
            {charge.status === "expired" ? "Pago expirado" : "Pago rechazado"}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1.5 text-xs font-semibold text-warning-foreground">
            <Clock className="h-3.5 w-3.5" />
            Esperando pago
          </span>
        )}
      </div>

      {charge.awaitingInstruction && !primaryCopyCode && !charge.qrImageUrl && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/40 py-10 text-center">
          <Loader2 className="h-7 w-7 animate-spin text-foreground" />
          <p className="text-sm font-medium text-foreground">Generando instrucciones de pago...</p>
        </div>
      )}

      {charge.method === "OXXO" && (charge.barcodeUrl || charge.reference) && (
        <div className="flex flex-col items-center justify-center py-3">
          {charge.barcodeUrl && !barcodeError ? (
            <>
              <img
                src={charge.barcodeUrl}
                alt="Código de barras OXXO"
                className="max-h-24 w-auto object-contain"
                onError={() => setBarcodeError(true)}
              />
              {charge.reference && (
                <span className="mt-1.5 font-mono text-xs tracking-widest text-foreground">
                  {charge.reference}
                </span>
              )}
            </>
          ) : charge.reference ? (
            <PaymentBarcode reference={charge.reference} />
          ) : null}
        </div>
      )}

      {['NEQUI', 'BREB', 'PIX'].includes(charge.method) && (charge.qrImageUrl || charge.copyPaste) && (
        <div className="flex flex-col items-center py-2">
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            {charge.copyPaste ? <QRCodeSVG value={charge.copyPaste} size={208} /> : <img
              src={charge.qrImageUrl}
              alt={`Código QR ${meta.label}`}
              className="h-52 w-52 object-contain"
            />}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Abre la app de tu banco y escanea el código.
          </p>
        </div>
      )}

      {primaryCopyCode && (
        <div className="rounded-lg border border-border bg-muted/40 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {copyLabel}
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <code className="min-w-0 flex-1 break-all font-mono text-xs text-foreground sm:text-sm">
              {primaryCopyCode}
            </code>
            <Button
              type="button"
              onClick={() => void copyText(primaryCopyCode, "primary")}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {copiedField === "primary" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedField === "primary" ? "Copiado" : "Copiar"}
            </Button>
          </div>
        </div>
      )}

      {charge.brebKey && (
        <div className="rounded-lg border border-border bg-muted/40 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            LLAVE BRE-B
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <code className="font-mono text-sm font-semibold text-foreground">{charge.brebKey}</code>
            <Button
              type="button"
              onClick={() => { if (charge.brebKey) void copyText(charge.brebKey, "breb"); }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {copiedField === "breb" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedField === "breb" ? "Copiado" : "Copiar"}
            </Button>
          </div>
        </div>
      )}

      {(charge.bankName || charge.beneficiary) && (
        <div className="space-y-2">
          {charge.bankName && (
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
              <span className="text-muted-foreground">Banco</span>
              <span className="font-semibold text-foreground">{charge.bankName}</span>
            </div>
          )}
          {charge.beneficiary && (
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
              <span className="text-muted-foreground">Beneficiario</span>
              <span className="font-semibold text-foreground">{charge.beneficiary}</span>
            </div>
          )}
        </div>
      )}

      {charge.method === "OXXO" && (
        <div className="flex items-center gap-2.5 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-xs font-medium text-warning-foreground">
          <Info className="h-4 w-4 shrink-0 text-warning" />
          <span>Paga exactamente {formattedAmount}. Cualquier diferencia retrasa la confirmación.</span>
        </div>
      )}

      {!primaryCopyCode && !charge.qrImageUrl && charge.checkoutUrl && (
        <a
          href={charge.checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Abrir página de pago {meta.label}
          <ExternalLink className="h-4 w-4" />
        </a>
      )}

      <ol className="space-y-2.5 pt-1 text-sm text-foreground">
        {meta.instructions.map((stepText, idx) => (
          <li key={idx} className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
              {idx + 1}
            </span>
            <span>{stepText}</span>
          </li>
        ))}
      </ol>

      <div className="flex items-center gap-2.5 rounded-lg bg-muted/70 px-4 py-3 text-xs text-muted-foreground">
        <Hourglass className="h-4 w-4 shrink-0" />
        <span>Esta página verifica la confirmación de {meta.label}. Espera a que se reciba el pago.</span>
      </div>
    </div>
  );
}