import { AnnouncementCarousel } from "@/components/home/AnnouncementCarousel";
import { Hero } from "@/components/home/Hero";
import { VideoSection } from "@/components/home/VideoSection";
import { UniversesSection } from "@/components/home/UniversesSection";
import { PopularPrograms } from "@/components/home/PopularPrograms";
import { AiSection } from "@/components/home/AiSection";
import { WhyIpmd } from "@/components/home/WhyIpmd";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { ContactTeaser } from "@/components/home/ContactTeaser";

export default function HomePage() {
  return (
    <>
      <AnnouncementCarousel />
      <Hero />
      <VideoSection videoId="azB3Irjscyg" />
      <UniversesSection />
      <PopularPrograms />
      <AiSection />
      <WhyIpmd />
      <CtaBanner
        title="Lancez votre admission dès aujourd'hui"
        description="Quelques minutes suffisent pour déposer votre demande. Notre équipe vous accompagne dans le choix de votre parcours."
      />
      <ContactTeaser />
    </>
  );
}
