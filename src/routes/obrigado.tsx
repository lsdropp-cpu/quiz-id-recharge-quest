import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle, Diamond, Gift, Clock, AlertTriangle, Sparkles, BookOpen } from "lucide-react";
import { useUtmifyHotmartPixel } from "@/hooks/useUtmifyHotmartPixel";
import { trackFunnel } from "@/lib/gemtop-tracking";

const freefireLogo = "https://recargasdiamante.site/assets/freefire-logo-khkzMQoZ.png";

export const Route = createFileRoute("/obrigado")({
  head: () => ({
    meta: [
      { title: "¡Gracias por tu compra! — Free Fire" },
      { name: "description", content: "Tu recarga fue registrada correctamente. Estamos procesando tus Diamantes." },
      { property: "og:title", content: "¡Gracias por tu compra! — Free Fire" },
      { property: "og:description", content: "Tu recarga fue registrada correctamente. Estamos procesando tus Diamantes." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: freefireLogo },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:image", content: freefireLogo },
    ],
  }),
  component: ThankYou,
});

function ThankYou() {
  useUtmifyHotmartPixel();

  // Track purchase on thank you page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    trackFunnel("obrigado", {
      source: params.get("utm_source") || localStorage.getItem("utm_source"),
      metadata: {
        utm_medium: params.get("utm_medium"),
        utm_campaign: params.get("utm_campaign"),
      },
    });
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <main className="w-full max-w-md bg-card rounded-2xl shadow-xl p-6 animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img src={freefireLogo} alt="Free Fire" className="h-16" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-primary/15 border border-primary/40 text-primary mb-4">
          <Diamond className="w-4 h-4" />
          <span>Pedido confirmado – Recarga en processamento</span>
        </div>

        {/* Header */}
        <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
          <span className="text-2xl">🧡</span>
          ¡Gracias por tu compra, Sobreviviente!
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Tu recarga fue registrada correctamente. Ahora vamos a procesar tus Diamantes con máxima seguridad.
        </p>

        {/* Section 1 */}
        <section className="mb-5">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-primary">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted border border-border text-foreground">1</span>
            Tu pedido fue recibido correctamente
            <CheckCircle className="w-4 h-4 text-green-400" />
          </h2>
          <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
            Hemos recibido tu pago y tu pedido está siendo procesado con éxito.
            En las próximas horas comenzaremos la verificación de los datos de tu cuenta para entregar tus Diamantes de la forma más segura posible.
          </p>
          <div className="info-box">
            <strong>Importante:</strong> guarda este correo/página, ya que es la confirmación de tu compra.
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-5">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-primary">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted border border-border text-foreground">2</span>
            ¿Cuándo recibiré mis Diamantes?
            <Diamond className="w-4 h-4 text-cyan-400" />
          </h2>
          <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
            Para garantizar que recibas todos tus Diamantes + el bono especial de forma segura, tu recarga pasa por un proceso de validación.
          </p>
          <p className="text-primary font-semibold text-sm flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4" />
            Plazo máximo: hasta 7 días
          </p>
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
            En la mayoría de los casos, los Diamantes se acreditan mucho antes (entre 24 y 72 horas).
            Sin embargo, trabajamos con un plazo de seguridad de hasta 7 días para incluir los bonos y promociones especiales sin riesgo para tu cuenta.
          </p>
          <p className="text-xs text-muted-foreground font-semibold mb-2">👉 Si aún no ves los Diamantes en tu cuenta:</p>
          <ul className="space-y-1 text-sm text-muted-foreground ml-1">
            <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span> Revisa primero tu cuenta de Free Fire después de unas horas.</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span> Verifica también tu correo electrónico (incluida la carpeta de spam o promociones).</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span> Solo si has pasado el plazo máximo, contáctanos por soporte.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="mb-5">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-primary">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted border border-border text-foreground">3</span>
            Sobre tus Bonos y Promociones
            <Gift className="w-4 h-4 text-pink-400" />
          </h2>
          <p className="text-sm text-muted-foreground mb-2">Por haber aprovechado esta oferta, desbloqueaste:</p>
          <ul className="space-y-1 text-sm text-muted-foreground ml-1 mb-3">
            <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span> 💎 Diamantes del paquete que elegiste</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span> 💠 Diamantes extra de bonificación (BONO)</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span> ⚡ Posibles bonos promocionales adicionales según la campaña activa</li>
          </ul>
          <p className="text-xs text-muted-foreground font-semibold mb-2">En algunos casos:</p>
          <ul className="space-y-1 text-sm text-muted-foreground ml-1">
            <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span> Los Diamantes principales y el bono pueden acreditarse en momentos diferentes.</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span> No te preocupes: si la oferta incluía bono, será respetada dentro del plazo de procesamiento.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="mb-5">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-primary">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted border border-border text-foreground">4</span>
            Tu Guía de Bonus
            <BookOpen className="w-4 h-4 text-blue-400" />
          </h2>
          <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
            Como agradecimiento por tu compra, también vas a recibir un guía exclusivo donde aprenderás:
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground ml-1 mb-3">
            <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span> Las mejores formas de invertir tus Diamantes sin desperdiciarlos.</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span> Cómo priorizar skins, pases y eventos para maximizar ventajas en el juego.</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span> Errores comunes que hacen muchos jugadores al gastar Diamantes.</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span> Estrategias para construir una cuenta más fuerte y competitiva.</li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Este guía fue creado justamente para que saques el máximo provecho de tu recarga y sientas que cada Diamante valió la pena.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mb-5">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-primary">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted border border-border text-foreground">5</span>
            Antes de solicitar reembolso o abrir disputa…
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </h2>
          <div className="p-3 rounded-xl bg-destructive/20 border border-destructive/50 text-xs text-foreground mb-3">
            <p className="mb-2">
              Sabemos que a veces la ansiedad por recibir los Diamantes es grande 😅 Pero recuerda:
            </p>
            <ul className="space-y-1 ml-1">
              <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span> Tu pedido ya fue registrado y está en proceso.</li>
              <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span> El plazo máximo es de hasta 7 días, debido a validaciones y bonificaciones.</li>
              <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span> Pedidos duplicados, cancelaciones y reembolsos pueden anular la oferta, el bono y el acceso al guía.</li>
            </ul>
          </div>
        </section>

        {/* Section 6 */}
        <section className="mb-5">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-primary">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted border border-border text-foreground">6</span>
            Mientras esperas…
            <Sparkles className="w-4 h-4 text-purple-400" />
          </h2>
          <p className="text-sm text-muted-foreground mb-2">Mientras procesamos tu recarga, puedes:</p>
          <ul className="space-y-1 text-sm text-muted-foreground ml-1">
            <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span> Organizar tus próximas compras dentro del juego.</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span> Pensar qué skins, pases o eventos quieres priorizar.</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold">•</span> Revisar tu correo para recibir el guía de bonus y empezar a leerlo.</li>
          </ul>
        </section>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-border text-sm text-foreground">
          <p className="font-bold mb-2">🧡 Gracias por confiar en nosotros.</p>
          <p className="text-muted-foreground">
            Tu cuenta está un paso más cerca de convertirse en la de un{" "}
            <span className="font-semibold text-primary">Pro Player de Free Fire</span>.<br />
            ¡Nos vemos dentro del juego!
          </p>
        </div>
      </main>
    </div>
  );
}
