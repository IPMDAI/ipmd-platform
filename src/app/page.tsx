import { Hero } from "@/components/home/Hero";
import { UniversesSection } from "@/components/home/UniversesSection";
import { AiCarousel } from "@/components/home/AiCarousel";
import { AiSection } from "@/components/home/AiSection";
import { WhyIpmd } from "@/components/home/WhyIpmd";
import { StudentLife } from "@/components/home/StudentLife";
import { MediaGallery } from "@/components/home/MediaGallery";
import { VideosBand } from "@/components/home/VideosBand";
import { PartnersBand } from "@/components/home/PartnersBand";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { ContactTeaser } from "@/components/home/ContactTeaser";

export default function HomePage() {
  return (
    <>
      <Hero />
      <UniversesSection />
      <AiCarousel />
      <AiSection />
      <WhyIpmd />
      <StudentLife />
      <MediaGallery
        dir="galerie-reconversion"
        variant="light"
        eyebrow="Reconversion & adultes en activité"
        title="Se réorienter vers le digital, à tout âge"
        description="Des parcours pratiques pour les adultes en activité et en reconversion qui rejoignent les métiers du digital et de l'IA."
      />
      <MediaGallery
        dir="galerie-pros"
        variant="white"
        eyebrow="Formation continue"
        title="Nos professionnels en formation"
        description="Cadres et professionnels en activité qui montent en compétences à l'IPMD (cours du soir, formation continue, certifications)."
      />
      <MediaGallery
        dir="galerie-entreprises"
        variant="light"
        eyebrow="Formation en entreprise"
        title="Entreprises & organisations formées"
        description="Des entreprises et organisations qui ont formé leurs équipes aux métiers du digital et de l'IA avec l'IPMD."
      />
      <VideosBand />
      <PartnersBand />
      <CtaBanner
        title="Lancez votre admission dès aujourd'hui"
        description="Quelques minutes suffisent pour déposer votre demande. Notre équipe vous accompagne dans le choix de votre parcours."
      />
      <ContactTeaser />
    </>
  );
}
