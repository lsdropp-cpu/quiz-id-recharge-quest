import { mayTrack, readConsent } from './tiktok-tracking';

export const META_PIXEL_ID = '1193530602870876';
type Pixel = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: Pixel;
  loaded: boolean;
  version: string;
};
declare global { interface Window { fbq?: Pixel; _fbq?: Pixel } }
let initialized = false;
let enabled = false;
let lastPage = '';

export function metaScope(path: string) {
  return ['/quiz', '/idplayer', '/recharge', '/local', '/'].includes(path);
}

function cleanUrl() {
  const url = new URL(window.location.href);
  for (const key of [...url.searchParams.keys()]) {
    if (/email|phone|name|player|document|address|client_secret/i.test(key)) url.searchParams.delete(key);
  }
  if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
}

export function syncMetaConsent() {
  if (!metaScope(window.location.pathname) || !mayTrack()) {
    if (enabled) window.fbq?.('consent', 'revoke');
    enabled = false;
    lastPage = '';
    return false;
  }
  cleanUrl();
  if (!initialized) {
    if (!window.fbq) {
      const pixel = function (...args: unknown[]) {
        if (pixel.callMethod) pixel.callMethod.apply(pixel, args);
        else pixel.queue.push(args);
      } as Pixel;
      pixel.queue = [];
      pixel.push = pixel;
      pixel.loaded = true;
      pixel.version = '2.0';
      window.fbq = pixel;
      window._fbq = pixel;
      const script = document.createElement('script');
      script.id = 'meta-direct-pixel';
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(script);
    }
    window.fbq('set', 'autoConfig', false, META_PIXEL_ID);
    window.fbq('init', META_PIXEL_ID, {}, { agent: 'lovable' });
    initialized = true;
  }
  if (!enabled) window.fbq?.('consent', 'grant');
  enabled = true;
  return true;
}

export function trackMetaPage() {
  if (!syncMetaConsent()) return;
  const page = window.location.pathname + window.location.search;
  if (lastPage === page) return;
  window.fbq?.('trackSingle', META_PIXEL_ID, 'PageView');
  lastPage = page;
}

export type LocalPurchase = { requestNumber: string; status: string; amount: number; currency: string };
export function isMetaPaidPurchase(charge: LocalPurchase) {
  return Boolean(charge.requestNumber) && ['confirmed', 'completed'].includes(charge.status)
    && Number.isFinite(charge.amount) && charge.amount > 0 && /^[A-Z]{3}$/.test(charge.currency);
}

export function trackMetaPurchase(charge: LocalPurchase) {
  if (!isMetaPaidPurchase(charge)) return false;
  const key = `meta-purchase:${META_PIXEL_ID}:${charge.requestNumber}`;
  try {
    if (localStorage.getItem(key)) return false;
    const allowed = syncMetaConsent();
    // Persist blocked outcomes too: later acceptance must not replay them.
    localStorage.setItem(key, JSON.stringify({ blocked: !allowed, choice: readConsent(), recordedAt: new Date().toISOString() }));
    if (!allowed) return false;
    window.fbq?.('trackSingle', META_PIXEL_ID, 'Purchase', {
      value: charge.amount, currency: charge.currency,
    }, { eventID: `xpag:${charge.requestNumber}` });
    return true;
  } catch { return false; }
}