import garenaLogo from "@/assets/garena-logo.png";
import membershipsBanner from "@/assets/memberships-banner.webp";
import freefireCharacter from "@/assets/freefire-character.png";
import freefireBanner from "@/assets/freefire-banner.webp.asset.json";

const GarenaHeader = () => (
  <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
    <div className="flex items-center gap-2.5">
      <img src={garenaLogo} alt="Garena" className="w-9 h-9 sm:w-10 sm:h-10 object-contain" />
      <div className="text-xs sm:text-sm leading-tight">
        <p className="text-muted-foreground">Canal Oficial de</p>
        <p className="text-foreground font-bold">Recarga</p>
      </div>
    </div>
    <img src={membershipsBanner} alt="Membresías Free Fire" className="w-full rounded-xl shadow-md" />
    <div>
      <p className="text-sm sm:text-base font-bold text-foreground mb-2">Selección de Juego</p>
      <div className="inline-flex items-center gap-2 border-2 border-primary rounded-full px-3 py-1.5 sm:px-4 sm:py-2 bg-card">
        <img src={freefireCharacter} alt="Free Fire" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
        <span className="text-foreground font-medium text-sm sm:text-base">Free Fire</span>
      </div>
    </div>
    <img src={freefireBanner.url} alt="Free Fire" className="w-full rounded-xl shadow-md" loading="lazy" />
  </div>
);

export default GarenaHeader;
