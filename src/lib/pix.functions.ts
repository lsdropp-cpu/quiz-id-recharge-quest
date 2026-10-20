import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { brPackages } from "./br-packages";

const trackingSchema = z
  .object({
    utm_source: z.string().max(300).nullish(),
    utm_medium: z.string().max(300).nullish(),
    utm_campaign: z.string().max(300).nullish(),
    utm_content: z.string().max(300).nullish(),
    utm_term: z.string().max(300).nullish(),
    src: z.string().max(300).nullish(),
    sck: z.string().max(300).nullish(),
  })
  .partial();

const createSchema = z.object({
  plan: z.number().int().min(0).max(brPackages.length - 1),
  name: z.string().trim().min(3).max(120),
  email: z.string().trim().email().max(200),
  cpf: z.string().regex(/^\d{11}$/),
  phone: z.string().regex(/^\d{10,11}$/),
  playerId: z.string().trim().max(40).optional(),
  tracking: trackingSchema,
});

export const createPixOrder = createServerFn({ method: "POST" })
  .validator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { freepayCreatePix, sendUtmify } = await import("./freepay.server");
    const pkg = brPackages[data.plan];
    const req = getRequest();
    const origin = new URL(req.url).origin;
    const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const t = data.tracking;
    const planName = `${pkg.diamonds} Diamantes + ${pkg.bonus} Bônus`;

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        amount: pkg.cents, currency: "BRL", plan_id: `br-${data.plan}`, plan_name: planName,
        email: data.email, customer_name: data.name, document: data.cpf, phone: data.phone,
        player_id: data.playerId || null, country: "BR", ip, status: "pending",
        user_agent: req.headers.get("user-agent"),
        utm_source: t.utm_source ?? null, utm_medium: t.utm_medium ?? null, utm_campaign: t.utm_campaign ?? null,
        utm_content: t.utm_content ?? null, utm_term: t.utm_term ?? null, src: t.src ?? null, sck: t.sck ?? null,
      })
      .select("*")
      .single();
    if (error || !order) {
      console.error("[pix] insert failed", error);
      throw new Error("Erro ao criar o pedido. Tente novamente.");
    }

    const tx = await freepayCreatePix({
      amount: pkg.cents,
      payment_method: "pix",
      postback_url: origin.startsWith("https://") ? `${origin}/api/public/freepay-webhook` : undefined,
      customer: { name: data.name, email: data.email, document: { number: data.cpf, type: "cpf" }, phone: data.phone },
      items: [{ title: "E-book de receitas com casca de banana", unit_price: pkg.cents, quantity: 1, tangible: false, external_ref: order.id }],
      pix: { expires_in_days: 1 },
      metadata: { provider_name: "Funil Magico", order_id: order.id },
      ...(ip ? { ip } : {}),
    });

    await supabaseAdmin.from("orders").update({ freepay_transaction_id: tx.id, pix_qr_code: tx.pix.qr_code }).eq("id", order.id);
    if (await sendUtmify(order, "waiting_payment")) {
      await supabaseAdmin.from("orders").update({ utmify_sent_waiting: true }).eq("id", order.id);
    }

    return { orderId: order.id as string, qrCode: tx.pix.qr_code, amount: pkg.cents, planName };
  });

export const getPixOrderStatus = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { freepayGetStatus, finalizePaidOrder } = await import("./freepay.server");
    const { data: order } = await supabaseAdmin
      .from("orders").select("status, freepay_transaction_id").eq("id", data.orderId).maybeSingle();
    if (!order) return { status: "not_found" as const };
    if (order.status === "paid") return { status: "paid" as const };
    if (order.freepay_transaction_id) {
      const s = await freepayGetStatus(order.freepay_transaction_id);
      if (s === "PAID") {
        await finalizePaidOrder(data.orderId);
        return { status: "paid" as const };
      }
      if (s === "EXPIRED" || s === "REFUSED" || s === "ERROR") return { status: "expired" as const };
    }
    return { status: "pending" as const };
  });
