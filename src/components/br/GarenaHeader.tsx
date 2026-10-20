import garenaLogo from "@/assets/garena-logo.png";
import membershipsBanner from "@/assets/br-memberships-banner.jpg";
import FreeFireGameMark from "@/components/FreeFireGameMark";
import freefireBanner from "@/assets/br-freefire-banner.jpg";

const GarenaHeader = () => (
  <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
    <div className="flex items-center gap-2.5">
      <img src={garenaLogo} alt="Garena" className="w-9 h-9 sm:w-10 sm:h-10 object-contain" />
      <div className="text-xs sm:text-sm leading-tight">
        <p className="text-muted-foreground">Canal Oficial de</p>
        <p className="text-foreground font-bold">Recarga</p>
      </div>
    </div>
    <img src={membershipsBanner} alt="Assinaturas Free Fire" className="w-full rounded-xl shadow-md" />
    <div>
      <p className="text-sm sm:text-base font-bold text-foreground mb-2">Seleção de jogo</p>
      <FreeFireGameMark />
    </div>
    <img src={freefireBanner} alt="Free Fire" className="w-full rounded-xl shadow-md" loading="lazy" />
  </div>
);

export default GarenaHeader;
