import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2, XCircle, Mail, User, Package, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFunnelTracking } from "@/hooks/useFunnelTracking";
import diamondIcon from "@/assets/diamond-icon.png";

type OrderRow = {
  id: string;
  email: string;
  player_id: string | null;
  plan_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  status: string;
  delivered: boolean;
  delivered_at: string | null;
  created_at: string;
  stripe_session_id: string | null;
};

const formatAmount = (amount: number, currency: string) =>
  `$${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;

export const Route = createFileRoute("/checkout-success")({
  head: () => ({ meta: [
    { title: "Estado del pago — Free Fire" },
    { name: "description", content: "Consulta el estado de tu pago y recarga Free Fire." },
    { property: "og:title", content: "Estado del pago — Free Fire" },
    { property: "og:description", content: "Consulta el estado de tu pago y recarga Free Fire." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: CheckoutSuccess,
});

function CheckoutSuccess() {
  useFunnelTracking("checkout-success");
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [state, setState] = useState<"loading" | "confirmed" | "pending" | "failed" | "notfound">(
    "loading",
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const sessionId = sp.get("session_id");
    const paymentIntentId = sp.get("payment_intent");

    if (!sessionId && !paymentIntentId) {
      setState("notfound");
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20;

    const poll = async () => {
      let query = supabase
        .from("orders")
        .select(
          "id, email, player_id, plan_id, plan_name, amount, currency, status, delivered, delivered_at, created_at, stripe_session_id",
        );

      query = paymentIntentId
        ? query.eq("stripe_payment_intent_id", paymentIntentId)
        : query.eq("stripe_session_id", sessionId!);

      const { data } = await query.maybeSingle();
      if (cancelled) return false;

      if (data) {
        setOrder(data as OrderRow);
        if (data.status === "paid" && data.delivered) {
          setState("confirmed");
          return true;
        }
        if (data.status === "failed") {
          setState("failed");
          return true;
        }
        setState("pending");
      } else {
        setState("pending");
      }

      // Fallback: ask Stripe directly if the webhook hasn't landed yet
      if (paymentIntentId) {
        try {
          await supabase.functions.invoke("confirm-payment", {
            body: { paymentIntentId },
          });
        } catch (e) {
          console.warn("confirm-payment fallback failed:", e);
        }
      }
      return false;
    };

    const interval = setInterval(async () => {
      attempts++;
      const done = await poll();
      if (done || attempts >= maxAttempts) clearInterval(interval);
    }, 2000);

    poll();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-6 sm:py-10 md:py-16">
        <div className="max-w-lg mx-auto">
          <div className="bg-card rounded-2xl shadow-lg p-6 sm:p-8 text-center mb-4 sm:mb-6">
            {state === "loading" && (
              <>
                <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
                <h1 className="text-2xl font-bold text-foreground mb-2">Cargando pedido...</h1>
              </>
            )}

            {state === "pending" && (
              <>
                <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
                <h1 className="text-2xl font-bold text-foreground mb-2">Confirmando tu pago...</h1>
                <p className="text-muted-foreground text-sm">
                  Estamos verificando la transacción con Stripe. Esto puede tomar unos segundos.
                </p>
              </>
            )}

            {state === "confirmed" && (
              <>
                <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  ¡Gracias por tu compra!
                </h1>
                <p className="text-muted-foreground">
                  Tu pago fue confirmado y tus diamantes serán entregados pronto.
                </p>
              </>
            )}

            {state === "failed" && (
              <>
                <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-foreground mb-2">Pago no confirmado</h1>
                <p className="text-muted-foreground text-sm">
                  No pudimos confirmar tu pago. Si crees que es un error, contáctanos.
                </p>
              </>
            )}

            {state === "notfound" && (
              <>
                <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-foreground mb-2">Pedido no encontrado</h1>
                <p className="text-muted-foreground text-sm">
                  No pudimos encontrar el pedido. Verifica el enlace recibido.
                </p>
              </>
            )}
          </div>

          {order && (
            <div className="bg-card rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Detalles del pedido</h2>

              <div className="flex items-start gap-4 mb-5 pb-5 border-b border-border">
                <img src={diamondIcon} alt="" className="w-12 h-12 object-contain" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{order.plan_name}</p>
                  <p className="text-success font-bold text-lg">
                    {formatAmount(order.amount, order.currency)}
                  </p>
                </div>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Hash className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <dt className="text-muted-foreground">N° de pedido</dt>
                    <dd className="font-mono text-foreground truncate">{order.id}</dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <dt className="text-muted-foreground">Correo</dt>
                    <dd className="text-foreground truncate">{order.email}</dd>
                  </div>
                </div>

                {order.player_id && (
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <dt className="text-muted-foreground">ID del jugador</dt>
                      <dd className="text-foreground">{order.player_id}</dd>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Package className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <dt className="text-muted-foreground">Estado</dt>
                    <dd>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          order.status === "paid"
                            ? "bg-success/15 text-success"
                            : order.status === "failed"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {order.status === "paid"
                          ? "Pagado"
                          : order.status === "failed"
                            ? "Fallido"
                            : "Pendiente"}
                      </span>
                      {order.delivered && (
                        <span className="ml-2 text-xs text-success">• Entregado</span>
                      )}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>
          )}

          <Link
            to="/"
            className="block text-center w-full py-4 px-6 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/30 hover:brightness-110 transition-all"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  );
}
