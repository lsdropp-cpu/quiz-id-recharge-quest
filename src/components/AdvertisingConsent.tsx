import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { hasAdvertisingOptOut, readConsent, requiresConsent, resolveAdvertisingRegion, syncTikTokConsent, trackTikTokPage, updateAdvertisingChoice } from "@/lib/tiktok-tracking";

const copy = {
  es: { title: "Privacidad publicitaria", body: "TikTok utiliza visitas, cookies publicitarias y compras confirmadas para medir y optimizar anuncios. Puedes aceptar o rechazar y cambiar tu elección después.", accept: "Aceptar", reject: "Rechazar", settings: "Privacidad", policy: "Política de privacidad", close: "Cerrar" },
  en: { title: "Advertising privacy", body: "TikTok uses visits, advertising cookies and confirmed purchases to measure and optimize ads. You can accept or reject and change your choice later.", accept: "Accept", reject: "Reject", settings: "Privacy", policy: "Privacy policy", close: "Close" },
  br: { title: "Privacidade de anúncios", body: "O TikTok usa visitas, cookies de publicidade e compras aprovadas para medir e otimizar anúncios. Você pode aceitar ou recusar e mudar sua escolha depois.", accept: "Aceitar", reject: "Recusar", settings: "Privacidade", policy: "Política de privacidade", close: "Fechar" },
  fr: { title: "Confidentialité publicitaire", body: "TikTok utilise les visites, cookies publicitaires et achats confirmés pour mesurer et optimiser les publicités. Vous pouvez accepter ou refuser et modifier votre choix plus tard.", accept: "Accepter", reject: "Refuser", settings: "Confidentialité", policy: "Politique de confidentialité", close: "Fermer" },
};
export default function AdvertisingConsent() {
  const pathname = useRouterState({ select: state => state.location.pathname });
  const isCheckout = /(?:^|\/)checkout[^/]*(?:\/|$)/.test(pathname);
  const t = copy[pathname.startsWith("/br") ? "br" : pathname.startsWith("/fr") ? "fr" : pathname.endsWith("-en") ? "en" : "es"];
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [hasChoice, setHasChoice] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void resolveAdvertisingRegion().then(region => {
      if (cancelled) return;
      setOpen(requiresConsent(region) && !readConsent() && !hasAdvertisingOptOut());
      setHasChoice(Boolean(readConsent()));
      setReady(true);
      syncTikTokConsent();
    });
    const changed = () => syncTikTokConsent();
    const storage = (event: StorageEvent) => { if (event.key === "advertising_consent_v1" || event.key === null) changed(); };
    window.addEventListener("storage", storage);
    window.addEventListener("advertising-consent-change", changed);
    return () => { cancelled = true; window.removeEventListener("storage", storage); window.removeEventListener("advertising-consent-change", changed); };
  }, []);
  useEffect(() => { if (ready) trackTikTokPage(); }, [ready, pathname]);
  const choose = (accepted: boolean) => {
    if (!updateAdvertisingChoice(accepted)) return;
    setHasChoice(true);
    setOpen(false);
    if (accepted) trackTikTokPage();
  };
  return <>
    {open && !isCheckout && <section aria-label={t.title} className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background p-5 text-foreground">
      <div className="mx-auto max-w-3xl space-y-3">
        <h2 className="font-semibold">{t.title}</h2>
        <p className="text-sm text-muted-foreground">{t.body}</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="min-w-28" onClick={() => choose(false)}>{t.reject}</Button>
          <Button variant="outline" className="min-w-28" onClick={() => choose(true)}>{t.accept}</Button>
          {hasChoice && <Button variant="ghost" onClick={() => setOpen(false)}>{t.close}</Button>}
        </div>
      </div>
    </section>}
  </>;
}