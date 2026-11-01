import desktopAsset from "@/assets/freefire-hangar-desktop.png.asset.json";
import mobileAsset from "@/assets/freefire-hangar-mobile.png.asset.json";
import { Crosshair, Gem } from "lucide-react";

/** Presentation only: unmounts as soon as the quiz starts. */
export default function QuizLandingScenery() {
  return (
    <div className="quiz-entry-scenery" aria-hidden="true">
      <picture>
        <source media="(max-width: 767px)" srcSet={mobileAsset.url} />
        <img src={desktopAsset.url} alt="" fetchPriority="high" />
      </picture>
      <div className="quiz-entry-veil" />
      <div className="quiz-entry-masthead"><Crosshair /><span>FREE FIRE</span><Gem /></div>
      <div className="quiz-entry-side quiz-entry-side-left"><Gem /></div>
      <div className="quiz-entry-side quiz-entry-side-right"><Gem /></div>
    </div>
  );
}