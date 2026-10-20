import freefireIcon from "@/assets/freefire-selection-white.png";

/** Presentation-only selected game mark, shared across localized headers. */
export default function FreeFireGameMark() {
  return (
    <div className="inline-flex h-12 sm:h-14 items-center gap-3">
      <img
        src={freefireIcon}
        alt=""
        className="size-10 sm:size-11 shrink-0 rounded-lg object-contain"
      />
      <span className="font-sans text-xl sm:text-2xl font-medium leading-none text-foreground">Free Fire</span>
    </div>
  );
}