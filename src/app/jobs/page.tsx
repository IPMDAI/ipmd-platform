import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { FeedSection } from "@/components/sections/FeedSection";
import { getJobs } from "@/data/feed";

export const metadata: Metadata = {
  title: "IPMD Jobs — Emplois, stages, alternances & freelance",
  description:
    "Offres d'emploi, stages, alternances, missions freelance et recrutements dans le digital.",
};

export default function JobsPage() {
  const feed = getJobs("home");
  return (
    <>
      <PageHero
        eyebrow="💼 IPMD Jobs"
        title="Emplois, stages, alternances & missions"
        description="Des opportunités professionnelles dans le digital, partagées via notre réseau de partenaires."
      />
      {feed && (
        <Section variant="light">
          <FeedSection feed={feed} />
        </Section>
      )}
    </>
  );
}
