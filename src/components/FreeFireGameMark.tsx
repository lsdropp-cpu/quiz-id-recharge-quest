import { Check } from "lucide-react";
import freefireLogo from "@/assets/freefire-logo-white.png.asset.json";

/** Presentation-only selected game mark, shared across localized headers. */
export default function FreeFireGameMark() {
  return (
    <div className="inline-flex h-12 sm:h-14 items-center gap-5 border-b-2 border-primary pb-2">
      <img
        src={freefireLogo.url}
        alt="Free Fire"
        className="h-7 sm:h-8 w-auto object-contain"
      />
      <Check aria-hidden="true" className="size-4 shrink-0 text-primary" strokeWidth={3} />
    </div>
  );
}