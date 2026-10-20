import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendUtmifyOrder, formatUtmifyDate, type UtmifyStatus } from "../_shared/utmify.ts";

type OrderRow = {
  id: string;
  delivered: boolean;
  email: string;
  player_id: string | null;
  plan_id: string;
  plan_name: string;
  amount: number;
  customer_name: string | null;
  country: string | null;
  document: string | null;
  ip: string | null;
  created_at: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  src: string | null;
  sck: string | null;
  utmify_sent_paid: boolean;
  bump_selected: boolean;
  bump_amount: number;
};

const ORDER_COLUMNS =
  "id, delivered, email, player_id, plan_id, plan_name, amount, customer_name, country, document, ip, created_at, utm_source, utm_medium, utm_campaign, utm_content, utm_term, src, sck, utmify_sent_paid, bump_selected, bump_amount";

const PUSHCUT_WEBHOOK_URL =
  "https://api.pushcut.io/NhpL8edG__oFasgz_DOuF/notifications/MinhaNotifica%C3%A7%C3%A3o";

const sendPushcutNotification = async (order: {
  id: string;
  email: string;
  plan_name: string;
  amount: number;
  customer_name: string | null;
  country: string | null;
}): Promise<void> => {
  try {
    const amountUsd = (order.amount / 100).toFixed(2);
    const payload = {
      title: "💰 Venda Aprovada!",
      text: `Funil Magico\n${order.plan_name} - $${amountUsd} USD\nCliente: ${order.customer_name || order.email}${order.country ? ` (${order.country})` : ""}`,
    };
    const res = await fetch(PUSHCUT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("Pushcut notification failed:", res.status, body);
    } else {
      console.log("Pushcut notification sent for order:", order.id);
    }
  } catch (err) {
    console.error("Pushcut notification error:", err instanceof Error ? err.message : err);
  }
};

const getOrderIp = (order: OrderRow): string | undefined => {
  if (order.ip && String(order.ip).trim()) return String(order.ip).trim();
  return undefined;
};

const sendUtmifyForOrder = async (
  order: OrderRow,
  status: UtmifyStatus,
  approvedAt: Date | null,
): Promise<boolean> => {
  const products = [
    {
      id: order.plan_id,
      name: order.plan_name,
      planId: order.plan_id,
      planName: order.plan_name,
      quantity: 1,
      priceInCents: order.amount - (order.bump_selected ? order.bump_amount : 0),
    },
  ];
  if (order.bump_selected && order.bump_amount > 0) {
    products.push({
      id: "bump-1k-diamonds",
      name: "+1,000 diamantes extras",
      planId: "bump-1k-diamonds",
      planName: "+1,000 diamantes extras",
      quantity: 1,
      priceInCents: order.bump_amount,
    });
  }

  return await sendUtmifyOrder({
    orderId: order.id,
    status,
    createdAt: formatUtmifyDate(new Date(order.created_at)),
    approvedDate: approvedAt ? formatUtmifyDate(approvedAt) : null,
    customer: {
      name: order.customer_name || "Cliente",
      email: order.email,
      document: order.document,
      country: order.country,
      ip: getOrderIp(order),
    },
    products,
    trackingParameters: {
      src: order.src,
      sck: order.sck,
      utm_source: order.utm_source,
      utm_medium: order.utm_medium,
      utm_campaign: order.utm_campaign,
      utm_content: order.utm_content,
      utm_term: order.utm_term,
    },
    commission: {
      totalPriceInCents: order.amount,
      gatewayFeeInCents: 0,
      userCommissionInCents: order.amount,
      currency: "USD",
    },
  });
};

// Webhook receives raw body from Stripe; CORS not required (server-to-server)
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid signature";
      console.error("Webhook signature verification failed:", msg);
      return new Response(`Webhook Error: ${msg}`, { status: 400 });
    }

    console.log("Received event:", event.type, event.id);

    switch (event.type) {
      // Embedded Payment Element flow
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const meta = pi.metadata || {};

        const { data: order, error: fetchError } = await supabase
          .from("orders")
          .select(ORDER_COLUMNS)
          .eq("stripe_payment_intent_id", pi.id)
          .maybeSingle<OrderRow>();

        if (fetchError) {
          console.error("Failed to fetch order:", fetchError);
          throw fetchError;
        }

        const approvedAt = new Date();

        if (!order) {
          console.warn(
            "PI succeeded but no matching order in DB — ignoring (likely stale/test event):",
            pi.id,
          );
          break;
        }


        if (order.delivered && order.utmify_sent_paid) {
          console.log("Order already delivered & reported, skipping:", order.id);
          break;
        }

        // Sync bump + amount from the (authoritative) PaymentIntent in case
        // the customer toggled the order bump after the row was created.
        const piBumpSelected = meta.bump_selected === "true";
        const piBumpAmount = Number(meta.bump_amount || "0") || 0;
        const needsAmountSync =
          order.amount !== pi.amount ||
          order.bump_selected !== piBumpSelected ||
          order.bump_amount !== piBumpAmount;
        const hasTrackingBackfill =
          (!order.utm_source && meta.utm_source) ||
          (!order.utm_medium && meta.utm_medium) ||
          (!order.utm_campaign && meta.utm_campaign) ||
          (!order.utm_content && meta.utm_content) ||
          (!order.utm_term && meta.utm_term) ||
          (!order.src && meta.src) ||
          (!order.sck && meta.sck);

        const wasNotDelivered = !order.delivered;
        const updatePayload: Record<string, unknown> = {};
        if (wasNotDelivered) {
          updatePayload.status = "paid";
          updatePayload.delivered = true;
          updatePayload.delivered_at = approvedAt.toISOString();
        }
        if (needsAmountSync) {
          updatePayload.amount = pi.amount;
          updatePayload.bump_selected = piBumpSelected;
          updatePayload.bump_amount = piBumpAmount;
        }
        if (!order.utm_source && meta.utm_source) updatePayload.utm_source = meta.utm_source;
        if (!order.utm_medium && meta.utm_medium) updatePayload.utm_medium = meta.utm_medium;
        if (!order.utm_campaign && meta.utm_campaign) updatePayload.utm_campaign = meta.utm_campaign;
        if (!order.utm_content && meta.utm_content) updatePayload.utm_content = meta.utm_content;
        if (!order.utm_term && meta.utm_term) updatePayload.utm_term = meta.utm_term;
        if (!order.src && meta.src) updatePayload.src = meta.src;
        if (!order.sck && meta.sck) updatePayload.sck = meta.sck;

        if (Object.keys(updatePayload).length > 0) {
          // Idempotency guard: only mark delivered if the row is still un-delivered.
          // If a concurrent webhook delivery already flipped it, this update returns 0 rows.
          let updateQuery = supabase.from("orders").update(updatePayload).eq("id", order.id);
          if (wasNotDelivered) {
            updateQuery = updateQuery.eq("delivered", false);
          }
          const { data: updatedRows, error: updateError } = await updateQuery.select("id");

          if (updateError) {
            console.error("Failed to update order:", updateError);
            throw updateError;
          }

          const didDeliverNow = wasNotDelivered && (updatedRows?.length ?? 0) > 0;
          if (updatedRows && updatedRows.length > 0) {
            Object.assign(order, updatePayload);
          }

          // Only notify on the transition from un-delivered -> delivered.
          if (didDeliverNow) {
            await sendPushcutNotification(order);
          } else if (wasNotDelivered) {
            console.log("Order already delivered by concurrent webhook, skipping notify:", order.id);
            break;
          }
        }

        console.log(
          `Order ${order.id} paid via PaymentIntent. Email: ${order.email}, Player: ${order.player_id}, Plan: ${order.plan_name}, Bump: ${order.bump_selected}`,
        );

        if (!order.utmify_sent_paid) {
          const ok = await sendUtmifyForOrder(order, "paid", approvedAt);
          if (ok) {
            await supabase
              .from("orders")
              .update({ utmify_sent_paid: true })
              .eq("id", order.id);
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const { data: order } = await supabase
          .from("orders")
          .select(ORDER_COLUMNS)
          .eq("stripe_payment_intent_id", pi.id)
          .maybeSingle<OrderRow>();

        await supabase
          .from("orders")
          .update({ status: "failed" })
          .eq("stripe_payment_intent_id", pi.id);
        console.log("Order marked as failed for PI:", pi.id);

        if (order) {
          await sendUtmifyForOrder(order, "refused", null);
        }
        break;
      }

      // Legacy hosted Stripe Checkout flow (kept for backward compatibility)
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const sessionId = session.id;
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null;

        const { data: order, error: fetchError } = await supabase
          .from("orders")
          .select("id, delivered, email, player_id, plan_name")
          .eq("stripe_session_id", sessionId)
          .maybeSingle();

        if (fetchError) {
          console.error("Failed to fetch order:", fetchError);
          throw fetchError;
        }

        if (!order) {
          console.warn(
            "Checkout session completed but no matching order in DB — ignoring (likely stale/test event):",
            sessionId,
          );
          break;
        }


        if (order.delivered) {
          console.log("Order already delivered, skipping:", order.id);
          break;
        }

        const { error: updateError } = await supabase
          .from("orders")
          .update({
            status: "paid",
            stripe_payment_intent_id: paymentIntentId,
            delivered: true,
            delivered_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        if (updateError) {
          console.error("Failed to update order:", updateError);
          throw updateError;
        }

        console.log(`Order ${order.id} paid (hosted checkout).`);
        break;
      }

      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await supabase
          .from("orders")
          .update({ status: "failed" })
          .eq("stripe_session_id", session.id);
        console.log("Order marked as failed for session:", session.id);
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("stripe-webhook error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
