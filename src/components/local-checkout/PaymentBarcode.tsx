import { useEffect, useRef } from 'react';

export default function PaymentBarcode({ reference }: { reference: string }) {
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    let active = true;
    void import('jsbarcode').then(({ default: barcode }) => {
      if (!active || !svg.current) return;
      barcode(svg.current, reference, { format: 'CODE128', width: 2, height: 64, displayValue: true, margin: 10 });
    });
    return () => { active = false; };
  }, [reference]);
  return <svg ref={svg} role="img" aria-label="Código de barras OXXO" className="h-24 w-full max-w-sm" />;
}