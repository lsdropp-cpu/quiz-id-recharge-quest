import React from 'react';

/**
 * Visual-only preview of the wallet buttons (Apple Pay / Google Pay).
 *
 * These are static mockups. They are NOT connected to Stripe and must never be
 * shown to real customers, so the parent only renders them inside the Lovable
 * preview (localhost / id-preview-- host) or when ?vercarteiras=1 is present.
 * The real buttons come from PaymentRequestButtonElement.
 */

function AppleMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M17.05 12.66c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.02-3.76-2.05-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.9-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.89 2.65 3.24 2.6 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.39.81 1.4-.02 2.29-1.27 3.14-2.53.99-1.45 1.4-2.85 1.42-2.92-.03-.01-2.72-1.04-2.74-4.12zM14.5 4.9c.71-.87 1.19-2.07 1.06-3.27-1.02.04-2.27.68-3.01 1.55-.66.76-1.24 1.99-1.09 3.16 1.14.09 2.31-.58 3.04-1.44z" />
    </svg>
  );
}

function GoogleMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path fill="#4285F4" d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.26-2.09 3.58-5.16 3.58-8.66z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.94-2.93l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.72-4.95H1.28v3.09A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.28 14.27a7.2 7.2 0 0 1 0-4.54V6.64H1.28a12 12 0 0 0 0 10.72l4-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.28 6.64l4 3.09C6.22 6.88 8.87 4.75 12 4.75z" />
    </svg>
  );
}

export function WalletPreviewStrip({ lang = 'es' }: { lang?: 'es' | 'en' }) {
  const label =
    lang === 'en'
      ? 'Preview of wallet buttons shown in the customer’s browser'
      : 'Vista previa de los botones que se muestran en el navegador del cliente';

  return (
    <div className="space-y-2" data-wallet-preview="true">
      <div className="grid grid-cols-2 gap-3">
        {/* Apple Pay */}
        <div
          className="flex h-12 items-center justify-center gap-1.5 rounded-lg bg-black text-white"
          style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)' }}
        >
          <AppleMark className="h-5 w-5" />
          <span className="text-[17px] font-semibold tracking-tight">Pay</span>
        </div>

        {/* Google Pay */}
        <div className="flex h-12 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white">
          <GoogleMark className="h-5 w-5" />
          <span className="text-[17px] font-medium text-gray-700">Pay</span>
        </div>
      </div>
      <p className="text-center text-[11px] leading-snug text-muted-foreground">{label}</p>
    </div>
  );
}
