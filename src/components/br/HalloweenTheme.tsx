import type { ReactNode } from "react";
import FullHalloweenTheme from "@/components/HalloweenTheme";

// Presentation-only: BR funnel reuses the full Halloween scenery with Portuguese copy.
export default function HalloweenTheme({ children }: { children: ReactNode }) {
  return <FullHalloweenTheme eyebrow="Edição especial">{children}</FullHalloweenTheme>;
}
