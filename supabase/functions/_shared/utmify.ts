// Shared helper to send order events to Utmify.
// Docs: https://docs.utmify.com.br/api-reference/orders/create

const UTMIFY_ENDPOINT = "https://api.utmify.com.br/api-credentials/orders";

export type UtmifyStatus = "waiting_payment" | "paid" | "refused" | "refunded" | "chargedback";

type UtmifyOrderInput = {
  orderId: string;
  platform?: string;
  paymentMethod?: "credit_card" | "boleto" | "pix" | "free_price";
  status: UtmifyStatus;
  createdAt: string; // YYYY-MM-DD HH:mm:ss UTC
  approvedDate?: string | null;
  refundedAt?: string | null;
  customer: {
    name: string;
    email: string;
    phone?: string | null;
    document?: string | null;
    country?: string | null;
    ip?: string | null;
  };
  products: Array<{
    id: string;
    name: string;
    planId?: string | null;
    planName?: string | null;
    quantity: number;
    priceInCents: number;
  }>;
  trackingParameters: {
    src?: string | null;
    sck?: string | null;
    utm_source?: string | null;
    utm_campaign?: string | null;
    utm_medium?: string | null;
    utm_content?: string | null;
    utm_term?: string | null;
  };
  commission: {
    totalPriceInCents: number;
    gatewayFeeInCents: number;
    userCommissionInCents: number;
    currency?: string;
  };
  isTest?: boolean;
};

// Utmify accepts only ISO 3166-1 alpha-2 codes. Normalize known names/aliases.
const UTMIFY_ALLOWED_COUNTRIES = new Set([
  "AF","AL","DZ","AS","AD","AO","AI","AQ","AG","AR","AM","AW","AU","AT","AZ","BS","BH","BD","BB","BY","BE","BZ","BJ","BM","BT","BO","BQ","BA","BW","BV","BR","IO","BN","BG","BF","BI","CV","KH","CM","CA","KY","CF","TD","CL","CN","CX","CC","CO","KM","CG","CD","CK","CR","HR","CU","CW","CY","CZ","CI","DK","DJ","DM","DO","EC","EG","SV","GQ","ER","EE","SZ","ET","FK","FO","FJ","FI","FR","GF","PF","TF","GA","GM","GE","DE","GH","GI","GR","GL","GD","GP","GU","GT","GG","GN","GW","GY","HT","HM","VA","HN","HK","HU","IS","IN","ID","IR","IQ","IE","IM","IL","IT","JM","JP","JE","JO","KZ","KE","KI","KP","KR","KW","KG","LA","LV","LB","LS","LR","LY","LI","LT","LU","MO","MG","MW","MY","MV","ML","MT","MH","MQ","MR","MU","YT","MX","FM","MD","MC","MN","ME","MS","MA","MZ","MM","NA","NR","NP","NL","NC","NZ","NI","NE","NG","NU","NF","MP","NO","OM","PK","PW","PS","PA","PG","PY","PE","PH","PN","PL","PT","PR","QA","MK","RO","RU","RW","RE","BL","SH","KN","LC","MF","PM","VC","WS","SM","ST","SA","SN","RS","SC","SL","SG","SX","SK","SI","SB","SO","ZA","GS","SS","ES","LK","SD","SR","SJ","SE","CH","SY","TW","TJ","TZ","TH","TL","TG","TK","TO","TT","TN","TR","TM","TC","TV","UG","UA","AE","GB","UM","US","UY","UZ","VU","VE","VN","VG","WF","EH","YE","ZM","ZW","AX",
]);

const COUNTRY_NAME_TO_ISO2: Record<string, string> = {
  // Português
  "brasil": "BR", "brazil": "BR",
  "portugal": "PT",
  "estados unidos": "US", "estados unidos da america": "US", "eua": "US",
  "canada": "CA", "canadá": "CA",
  "mexico": "MX", "méxico": "MX",
  "argentina": "AR", "colombia": "CO", "colômbia": "CO",
  "chile": "CL", "peru": "PE", "perú": "PE", "uruguai": "UY", "uruguay": "UY",
  "paraguai": "PY", "paraguay": "PY", "bolivia": "BO", "bolívia": "BO",
  "venezuela": "VE", "equador": "EC", "ecuador": "EC",
  "guatemala": "GT", "costa rica": "CR", "panama": "PA", "panamá": "PA",
  "el salvador": "SV", "honduras": "HN", "nicaragua": "NI",
  "republica dominicana": "DO", "república dominicana": "DO", "dominican republic": "DO",
  "espanha": "ES", "españa": "ES", "spain": "ES",
  "italia": "IT", "itália": "IT", "italy": "IT",
  "frança": "FR", "francia": "FR", "france": "FR",
  "alemanha": "DE", "alemania": "DE", "germany": "DE",
  "reino unido": "GB", "inglaterra": "GB", "uk": "GB", "united kingdom": "GB",
  "irlanda": "IE", "ireland": "IE", "holanda": "NL", "netherlands": "NL",
  "belgica": "BE", "bélgica": "BE", "belgium": "BE", "suica": "CH", "suíça": "CH", "switzerland": "CH",
  "austria": "AT", "áustria": "AT", "polonia": "PL", "polônia": "PL", "poland": "PL",
  "romenia": "RO", "romênia": "RO", "romania": "RO", "suecia": "SE", "sweden": "SE",
  "japao": "JP", "japão": "JP", "japan": "JP",
  "china": "CN",
};

const normalizeCountry = (raw?: string | null): string | null => {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  // Already a 2-letter code
  if (trimmed.length === 2) {
    const upper = trimmed.toUpperCase();
    return UTMIFY_ALLOWED_COUNTRIES.has(upper) ? upper : null;
  }
  // Common 3-letter alias
  if (trimmed.length === 3) {
    const map3: Record<string, string> = { BRA: "BR", USA: "US", GBR: "GB", PRT: "PT", ESP: "ES", ARG: "AR", MEX: "MX", CHL: "CL", COL: "CO", PER: "PE", URY: "UY", PRY: "PY", BOL: "BO", VEN: "VE", ECU: "EC", FRA: "FR", DEU: "DE", ITA: "IT", JPN: "JP", CHN: "CN", CAN: "CA" };
    const code = map3[trimmed.toUpperCase()];
    if (code && UTMIFY_ALLOWED_COUNTRIES.has(code)) return code;
  }
  // Name lookup
  const key = trimmed.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const code = COUNTRY_NAME_TO_ISO2[key];
  if (code && UTMIFY_ALLOWED_COUNTRIES.has(code)) return code;
  return null;
};

export const formatUtmifyDate = (date: Date): string => {
  // Utmify expects "YYYY-MM-DD HH:mm:ss" in UTC
  const iso = date.toISOString(); // 2025-01-01T12:34:56.000Z
  return iso.slice(0, 10) + " " + iso.slice(11, 19);
};

export const sendUtmifyOrder = async (payload: UtmifyOrderInput): Promise<boolean> => {
  const token = Deno.env.get("UTMIFY_API_TOKEN");
  if (!token) {
    console.warn("[utmify] UTMIFY_API_TOKEN not configured, skipping");
    return false;
  }

  const normalizedCountry = normalizeCountry(payload.customer.country);

  const customer = {
    name: payload.customer.name || "Cliente",
    email: payload.customer.email,
    phone: payload.customer.phone ?? null,
    document: payload.customer.document ?? null,
    ...(normalizedCountry ? { country: normalizedCountry } : {}),
    ...(payload.customer.ip ? { ip: payload.customer.ip } : {}),
  };

  const body = {
    platform: payload.platform ?? "GarenaCheckout",
    paymentMethod: payload.paymentMethod ?? "credit_card",
    status: payload.status,
    createdAt: payload.createdAt,
    approvedDate: payload.approvedDate ?? null,
    refundedAt: payload.refundedAt ?? null,
    isTest: payload.isTest ?? false,
    orderId: payload.orderId,
    customer,
    products: payload.products.map((p) => ({
      id: p.id,
      name: p.name,
      planId: p.planId ?? null,
      planName: p.planName ?? null,
      quantity: p.quantity,
      priceInCents: p.priceInCents,
    })),
    trackingParameters: {
      src: payload.trackingParameters.src ?? null,
      sck: payload.trackingParameters.sck ?? null,
      utm_source: payload.trackingParameters.utm_source ?? null,
      utm_campaign: payload.trackingParameters.utm_campaign ?? null,
      utm_medium: payload.trackingParameters.utm_medium ?? null,
      utm_content: payload.trackingParameters.utm_content ?? null,
      utm_term: payload.trackingParameters.utm_term ?? null,
    },
    commission: {
      totalPriceInCents: payload.commission.totalPriceInCents,
      gatewayFeeInCents: payload.commission.gatewayFeeInCents,
      userCommissionInCents: payload.commission.userCommissionInCents,
      currency: payload.commission.currency ?? "USD",
    },
  };

  try {
    const res = await fetch(UTMIFY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token": token,
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error(`[utmify] ${payload.status} failed [${res.status}]: ${text}`);
      return false;
    }
    console.log(`[utmify] ${payload.status} sent for order ${payload.orderId}: ${text}`);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error(`[utmify] request error: ${msg}`);
    return false;
  }
};
