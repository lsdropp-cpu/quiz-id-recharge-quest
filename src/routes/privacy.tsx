import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { updateAdvertisingChoice } from '@/lib/tiktok-tracking';
import { useState } from 'react';

export const Route = createFileRoute('/privacy')({
  head: () => ({ meta: [
    { title: 'Privacidad publicitaria — Recarga Free Fire' },
    { name: 'description', content: 'Datos compartidos para medición publicitaria y opciones de consentimiento de Recarga Free Fire.' },
    { property: 'og:title', content: 'Privacidad publicitaria — Recarga Free Fire' },
    { property: 'og:description', content: 'Consulta los datos publicitarios compartidos y cambia tu consentimiento.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const [saved, setSaved] = useState(false);
  const choose = (accepted: boolean) => setSaved(updateAdvertisingChoice(accepted));
  return <main className="mx-auto max-w-3xl space-y-6 px-6 py-12 text-foreground">
    <h1 className="text-3xl font-bold">Privacidad publicitaria</h1>
    <p>Meta (Facebook e Instagram) y TikTok reciben visitas, información del navegador y dispositivo, dirección IP e identificadores de cookies publicitarias para medir y optimizar anuncios, cuando la medición está permitida.</p>
    <p>El Pixel de Meta recibe el importe y la moneda de compras confirmadas por XPag en este navegador. No enviamos nombres, correos ni teléfonos a Meta mediante esta integración, ni eventos desde el servidor. Los códigos o referencias pendientes no cuentan como compras.</p>
    <p>Las integraciones existentes de atribución, como Utmify, pueden procesar parámetros de campaña y datos introducidos en formularios. Nunca se comparten datos de tarjeta mediante el Pixel.</p>
    <p>En regiones que requieren consentimiento, no se inicia la medición publicitaria sin aceptación. El rechazo y las señales de exclusión del navegador bloquean la medición. Puedes retirar tu consentimiento aquí; la retirada se aplica a nuevos eventos y no elimina datos ya recibidos por las plataformas.</p>
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={() => choose(false)}>Rechazar publicidad</Button>
      <Button variant="outline" onClick={() => choose(true)}>Aceptar publicidad</Button>
    </div>
    {saved && <p role="status">Preferencia guardada.</p>}
    <a href="/quiz" className="inline-block underline">Volver</a>
  </main>;
}