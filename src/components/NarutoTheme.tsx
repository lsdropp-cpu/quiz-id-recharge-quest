import type { ReactNode } from "react";
import ninjaBackground from "@/assets/quiz2_naruto_reference.png.asset.json";
import ninjaPortrait from "@/assets/quiz2-naruto-portrait.jpg";

function Shuriken({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" className={className}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M50 4 61 39 96 50 61 61 50 96 39 61 4 50 39 39Zm0 37a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z"
      />
    </svg>
  );
}

function Kunai({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" className={className}>
      <path fill="currentColor" d="M50 4 62 36v20h-7v26h7v10H38v-10h7V56h-7V36Z" />
    </svg>
  );
}

export default function NarutoTheme({ children, continuation = false }: { children: ReactNode; continuation?: boolean }) {
  return (
    <div className={`quiz-ninja min-h-screen isolate${continuation ? " ninja-continuation" : ""}`}>
      <div className="quiz-ninja-scenery" aria-hidden="true">
        <picture>
          <source media="(max-width: 767px)" srcSet={ninjaPortrait} />
          <img src={ninjaBackground.url} alt="" width={648} height={364} fetchPriority="high" className="quiz-ninja-backdrop" />
        </picture>
        <div className="quiz-ninja-veil" />
        <Shuriken className="ninja-drift ninja-drift-one" />
        <Shuriken className="ninja-drift ninja-drift-two" />
        <Kunai className="ninja-drift ninja-drift-three" />
        <div className="ninja-cloud ninja-cloud-left" />
        <div className="ninja-cloud ninja-cloud-right" />
        <Shuriken className="ninja-side-art ninja-side-left text-primary" />
        <Shuriken className="ninja-side-art ninja-side-right text-primary" />
      </div>
      <header className="quiz-ninja-heading relative mx-auto flex max-w-lg items-center justify-center gap-3 px-4 pt-5">
        <Shuriken className="h-16 w-16 shrink-0 text-primary" />
        <div className="text-center">
          <p className="text-xs font-semibold uppercase text-primary">Edición especial</p>
          <h2 className="font-display text-3xl font-bold text-foreground">NARUTO</h2>
        </div>
        <Kunai className="h-12 w-12 shrink-0 rotate-45 text-primary" />
      </header>
      <div className="quiz-ninja-content relative">{children}</div>
      <footer aria-hidden="true" className="ninja-footer relative flex justify-center pb-6">
        <Shuriken className="h-24 w-24 text-primary" />
      </footer>
    </div>
  );
}
