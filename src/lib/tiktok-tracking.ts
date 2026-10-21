export const TIKTOK_PIXEL_ID = "DB22PJBC77U9003F8DDG";
export const CONSENT_KEY = "advertising_consent_v1";
export const NOTICE_VERSION = "tiktok-advertising-2026-10-21";
export const NOTICE = "TikTok receives page visits, approved purchase amount and currency, browser/device information, IP address and advertising cookie identifiers to measure and optimize ads. No name, email, card data or player ID is shared by this integration. Accept or reject advertising measurement; change your choice in Privacy settings.";

export type ConsentRecord = {
  visitorId: string; advertising: boolean; region: string | null;
  recordedAt: string; noticeVersion: string; notice: string;
  previousAcceptance?: { recordedAt: string; noticeVersion: string; notice: string };
};
const REGULATED = new Set("AT BE BG HR CY CZ DK EE FI FR DE GR HU IS IE IT LV LI LT LU MT NL NO PL PT RO SK SI ES SE GB CH".split(" "));
const COUNTRIES = new Set("AF AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CG CD CK CR HR CU CW CY CZ CI DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF TF GA GM GE GH GI GR GL GD GP GU GT GG GN GW GY HT HM VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA MK RO RU RW RE BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB UM US UY UZ VU VE VN VG WF EH YE ZM ZW AX".split(" "));
export function requiresConsent(region: string | null) {
  return !region || !COUNTRIES.has(region) || REGULATED.has(region);
}
export function advertisingAllowed(region: string | null, choice: ConsentRecord | null, optOut: boolean) {
  if (optOut || choice?.advertising === false) return false;
  return choice?.advertising === true || !requiresConsent(region);
}
export function createConsent(previous: ConsentRecord | null, advertising: boolean, region: string | null, visitorId: string, now: string): ConsentRecord {
  return { visitorId, advertising, region, recordedAt: now, noticeVersion: NOTICE_VERSION, notice: NOTICE,
    previousAcceptance: previous?.advertising ? { recordedAt: previous.recordedAt, noticeVersion: previous.noticeVersion, notice: previous.notice } : previous?.previousAcceptance };
}

let region: string | null = null;
let initialized = false;
const observedPurchases = new Set<string>();
type Queue = Array<unknown> & Record<string, any>;
declare global { interface Window { ttq?: Queue; TiktokAnalyticsObject?: string; } }
export function readConsent(): ConsentRecord | null {
  try {
    const value = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null");
    return value && typeof value.advertising === "boolean" && typeof value.visitorId === "string" && value.noticeVersion === NOTICE_VERSION ? value : null;
  } catch { return null; }
}
export function hasAdvertisingOptOut() {
  return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true || navigator.doNotTrack === "1";
}
export function mayTrack() { return advertisingAllowed(region, readConsent(), hasAdvertisingOptOut()); }
export async function resolveAdvertisingRegion() {
  try {
    const response = await fetch("/cdn-cgi/trace", { signal: AbortSignal.timeout(2000), credentials: "omit" });
    if (response.ok) {
      const code = (await response.text()).match(/^loc=([A-Z]{2})$/m)?.[1];
      region = code && COUNTRIES.has(code) ? code : null;
    }
  } catch { region = null; }
  return region;
}
export function updateAdvertisingChoice(accepted: boolean) {
  const previous = readConsent();
  const record = createConsent(previous, accepted, region, previous?.visitorId || crypto.randomUUID(), new Date().toISOString());
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(record)); } catch { return false; }
  syncTikTokConsent();
  window.dispatchEvent(new Event("advertising-consent-change"));
  return true;
}

// Strip customer fields before any SDK is loaded. Checkout state remains in React/server storage.
function removeCustomerFieldsFromUrl() {
  const url = new URL(window.location.href);
  for (const key of [...url.searchParams.keys()]) {
    if (/email|phone|name|player|document|address|client_secret/i.test(key)) url.searchParams.delete(key);
  }
  if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
}

export function syncTikTokConsent() {
  if (!mayTrack()) {
    window.ttq?.revokeConsent?.();
    window.ttq?.disableCookie?.();
    return;
  }
  if (!initialized) {
    removeCustomerFieldsFromUrl();
    const ttq = (window.ttq || []) as Queue;
    window.TiktokAnalyticsObject = "ttq";
    window.ttq = ttq;
    const methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
    ttq.setAndDefer = (target: Queue, method: string) => { target[method] = (...args: unknown[]) => target.push([method, ...args]); };
    for (const method of methods) ttq.setAndDefer(ttq, method);
    ttq.instance = (id: string) => {
      const instance = (ttq._i || {})[id] || [];
      for (const method of methods) ttq.setAndDefer(instance, method);
      return instance;
    };
    ttq.load = (id: string, options: Record<string, unknown>) => {
      const src = "https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i = ttq._i || {};
      ttq._i[id] = [];
      ttq._i[id]._u = src;
      ttq._t = ttq._t || {}; ttq._t[id] = Date.now();
      ttq._o = ttq._o || {}; ttq._o[id] = options;
      const script = document.createElement("script");
      script.id = "tiktok-direct-pixel";
      script.async = true;
      script.src = `${src}?sdkid=${id}&lib=ttq`;
      document.head.appendChild(script);
    };
    // Automatic customer matching is not requested; send only designated ordinary event data.
    ttq.load(TIKTOK_PIXEL_ID, { autoConfig: false });
    initialized = true;
  }
  window.ttq?.grantConsent?.();
  window.ttq?.enableCookie?.();
}
export function trackTikTokPage() {
  if (!mayTrack()) return;
  syncTikTokConsent();
  removeCustomerFieldsFromUrl();
  window.ttq?.page?.();
}

export type Purchase = { id: string; status: string; amount: number; currency: string; productId: string };
export function isApprovedPurchase(purchase: Purchase) {
  return Boolean(purchase.id) && purchase.status === "succeeded" && Number.isFinite(purchase.amount) && purchase.amount > 0 && /^[A-Z]{3}$/.test(purchase.currency);
}
export function trackTikTokPurchase(purchase: Purchase) {
  // Evaluate the visitor's current choice at the successful action. Never replay blocked purchases.
  if (!isApprovedPurchase(purchase) || observedPurchases.has(purchase.id)) return false;
  observedPurchases.add(purchase.id);
  const key = `tiktok-purchase:${TIKTOK_PIXEL_ID}:${purchase.id}`;
  try { if (localStorage.getItem(key)) return false; } catch { return false; }
  if (!mayTrack()) {
    try { localStorage.setItem(key, JSON.stringify({ blocked: true, region, choice: readConsent(), recordedAt: new Date().toISOString() })); } catch { /* Remain blocked in this visit. */ }
    return false;
  }
  try {
    syncTikTokConsent();
    removeCustomerFieldsFromUrl();
    if (!window.ttq?.track) return false;
    window.ttq.track("Purchase", { value: purchase.amount, currency: purchase.currency,
      contents: [{ content_id: purchase.productId, content_type: "product", quantity: 1 }] }, { event_id: purchase.id });
    // Evidence reference contains no customer identity. Browser receipt is not provider attribution.
    localStorage.setItem(key, JSON.stringify({ eventId: purchase.id, region, choice: readConsent(), recordedAt: new Date().toISOString() }));
    return true;
  } catch { return false; }
}