import { supabaseAdmin } from "@/integrations/supabase/client.server";

const API = "https://api.freepaybrasil.com/v1/payment-transaction";
const PUSHCUT_URL =
  "https://api.pushcut.io/NhpL8edG__oFasgz_DOuF/notifications/MinhaNotifica%C3%A7%C3%A3o";

const auth = () =>
  "Basic " + btoa(`${process.env["FREEPAY_PUBLIC_KEY"]}:${process.env["FREEPAY_SECRET_KEY"]}`);

export async function freepayCreatePix(body: Record<string, unknown>) {
  const res = await fetch(`${API}/create`, {
    method: "POST",
    headers: { authorization: auth(), "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => null)) as any;
  if (!res.ok || !json?.data?.pix?.qr_code) {
    console.error("[freepay] create failed", res.status, JSON.stringify(json?.errors ?? json?.error_messages ?? json));
    throw new Error("Não foi possível gerar o PIX. Confira seus dados e tente novamente.");
  }
  return json.data as { id: string; status: string; pix: { qr_code: string; expiration_date: string } };
}

export async function freepayGetStatus(id: string): Promise<string | null> {
  const res = await fetch(`${API}/info/${id}`, { headers: { authorization: auth() } });
  if (!res.ok) return null; // 429 rate limit etc.
  const json = (await res.json().catch(() => null)) as any;
  return json?.data?.status ?? null;
}

const utmifyDate = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");

export async function sendUtmify(order: any, status: "waiting_payment" | "paid") {
  const token = process.env["UTMIFY_API_TOKEN"];
  if (!token) return false;
  try {
    const res = await fetch("https://api.utmify.com.br/api-credentials/orders", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-token": token },
      body: JSON.stringify({
        orderId: order.id,
        platform: "FunilMagicoBR",
        paymentMethod: "pix",
        status,
        createdAt: utmifyDate(new Date(order.created_at)),
        approvedDate: status === "paid" ? utmifyDate(new Date()) : null,
        refundedAt: null,
        customer: {
          name: order.customer_name || "Cliente",
          email: order.email,
          phone: order.phone ?? null,
          document: order.document ?? null,
          country: "BR",
          ...(order.ip ? { ip: order.ip } : {}),
        },
        products: [{ id: order.plan_id, name: order.plan_name, planId: order.plan_id, planName: order.plan_name, quantity: 1, priceInCents: order.amount }],
        trackingParameters: {
          src: order.src, sck: order.sck, utm_source: order.utm_source, utm_campaign: order.utm_campaign,
          utm_medium: order.utm_medium, utm_content: order.utm_content, utm_term: order.utm_term,
        },
        commission: { totalPriceInCents: order.amount, gatewayFeeInCents: 0, userCommissionInCents: order.amount, currency: "BRL" },
        isTest: false,
      }),
    });
    if (!res.ok) console.error("[utmify] failed", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("[utmify] error", e);
    return false;
  }
}

// Marks the order paid exactly once, then notifies Pushcut and Utmify.
export async function finalizePaidOrder(orderId: string) {
  const { data } = await supabaseAdmin
    .from("orders")
    .update({ status: "paid", delivered: true, delivered_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("delivered", false)
    .select("*");
  const order = data?.[0];
  if (!order) return;
  try {
    await fetch(PUSHCUT_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "💰 Venda Aprovada! (PIX BR)",
        text: `Funil Magico\n${order.plan_name} - R$${(order.amount / 100).toFixed(2).replace(".", ",")}\nCliente: ${order.customer_name || order.email} (BR)`,
      }),
    });
  } catch (e) {
    console.error("[pushcut] error", e);
  }
  if (await sendUtmify(order, "paid")) {
    await supabaseAdmin.from("orders").update({ utmify_sent_paid: true }).eq("id", order.id);
  }
}
