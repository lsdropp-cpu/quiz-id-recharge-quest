import type { ReactNode } from "react";
import halloweenScene from "@/assets/br-halloween-event.jpg";
import pumpkins from "@/assets/halloween-pumpkins.png";

function Bat({ className }: { className: string }) {
  return <svg aria-hidden="true" viewBox="0 0 100 45" className={className}><path fill="currentColor" d="M50 17 44 7 41 17C26 5 13 6 0 0c3 15 9 26 21 32 0-9 8-9 14-2 4-7 9-3 15 15 6-18 11-22 15-15 6-7 14-7 14 2C91 26 97 15 100 0 87 6 74 5 59 17L56 7Z" /></svg>;
}

export default function HalloweenTheme({ children, eyebrow = "Edición especial" }: { children: ReactNode; eyebrow?: string }) {
  return (
    <div className="es-halloween min-h-screen isolate">
      <div className="es-halloween-scenery" aria-hidden="true">
        <img src={halloweenScene} alt="" width={1536} height={512} className="es-halloween-backdrop" />
        <div className="es-halloween-veil" />
        <Bat className="halloween-bat halloween-bat-one" />
        <Bat className="halloween-bat halloween-bat-two" />
        <Bat className="halloween-bat halloween-bat-three" />
        <div className="halloween-web halloween-web-left" />
        <div className="halloween-web halloween-web-right" />
        <img src={pumpkins} alt="" width={816} height={816} className="halloween-side-pumpkin halloween-side-left" />
        <img src={pumpkins} alt="" width={816} height={816} className="halloween-side-pumpkin halloween-side-right" />
      </div>
      <header className="es-halloween-heading relative mx-auto flex max-w-lg items-center justify-center gap-3 px-4 pt-5">
        <img src={pumpkins} alt="" width={816} height={816} className="h-16 w-16 shrink-0 object-contain" />
        <div className="text-center">
          <p className="text-xs font-semibold uppercase text-halloween-moon">{eyebrow}</p>
          <h2 className="font-display text-3xl font-bold text-foreground">HALLOWEEN</h2>
        </div>
        <svg aria-hidden="true" viewBox="0 0 100 45" className="h-8 w-12 shrink-0 text-halloween-moon"><path fill="currentColor" d="M50 17 44 7 41 17C26 5 13 6 0 0c3 15 9 26 21 32 0-9 8-9 14-2 4-7 9-3 15 15 6-18 11-22 15-15 6-7 14-7 14 2C91 26 97 15 100 0 87 6 74 5 59 17L56 7Z" /></svg>
      </header>
      <div className="es-halloween-content relative">{children}</div>
      <footer aria-hidden="true" className="halloween-footer relative flex justify-center pb-6">
        <img src={pumpkins} alt="" width={816} height={816} loading="lazy" className="h-24 w-24 object-contain" />
      </footer>
    </div>
  );
}