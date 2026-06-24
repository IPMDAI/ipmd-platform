import { Hero } from "@/components/home/Hero";
import { UniversesSection } from "@/components/home/UniversesSection";
import { AiSection } from "@/components/home/AiSection";
import { WhyIpmd } from "@/components/home/WhyIpmd";
import { PartnersBand } from "@/components/home/PartnersBand";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { ContactTeaser } from "@/components/home/ContactTeaser";

export default function HomePage() {
  return (
    <>
      <Hero />
      <UniversesSection />
      <AiSection />
      <WhyIpmd />
      <PartnersBand />
      <CtaBanner
        title="Lancez votre admission dès aujourd'hui"
        description="Quelques minutes suffisent pour déposer votre demande. Notre équipe vous accompagne dans le choix de votre parcours."
      />
      <ContactTeaser />
    </>
  );
}
