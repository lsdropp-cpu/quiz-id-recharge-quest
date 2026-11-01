import desktopAsset from "@/assets/freefire-hangar-desktop.png.asset.json";
import mobileAsset from "@/assets/freefire-hangar-mobile.png.asset.json";

/** Presentation only: unmounts as soon as the quiz starts. */
export default function QuizLandingScenery() {
  return (
    <div className="quiz-entry-scenery" aria-hidden="true">
      <picture>
        <source media="(max-width: 767px)" srcSet={mobileAsset.url} />
        <img src={desktopAsset.url} alt="" fetchPriority="high" />
      </picture>
      <div className="quiz-entry-veil" />
    </div>
  );
}