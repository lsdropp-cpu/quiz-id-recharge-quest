import garenaLogo from "@/assets/garena-logo.png";
import membershipsBanner from "@/assets/fr-memberships-banner.jpg";
import freefirePill from "@/assets/freefire-pill.png.asset.json";
import freefireBanner from "@/assets/fr-freefire-banner.jpg";

const GarenaHeader = () => (
  <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
    <div className="flex items-center gap-2.5">
      <img src={garenaLogo} alt="Garena" className="w-9 h-9 sm:w-10 sm:h-10 object-contain" />
      <div className="text-xs sm:text-sm leading-tight">
        <p className="text-muted-foreground">Canal officiel de</p>
        <p className="text-foreground font-bold">recharge</p>
      </div>
    </div>
    <img src={membershipsBanner} alt="Abonnements Free Fire" className="w-full rounded-xl shadow-md" />
    <div>
      <p className="text-sm sm:text-base font-bold text-foreground mb-2">Sélection du jeu</p>
      <img src={freefirePill.url} alt="Free Fire" className="h-11 sm:h-[52px] w-auto" />
    </div>
    <img src={freefireBanner} alt="Free Fire" className="w-full rounded-xl shadow-md" loading="lazy" />
  </div>
);

export default GarenaHeader;
