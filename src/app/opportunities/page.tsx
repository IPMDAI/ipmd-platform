import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { FeedSection } from "@/components/sections/FeedSection";
import { getOpportunities } from "@/data/feed";

export const metadata: Metadata = {
  title: "IPMD Opportunities — Bourses, concours & programmes",
  description:
    "Bourses d'études, concours, appels à projets, financements, hackathons, incubateurs et programmes internationaux.",
};

export default function OpportunitiesPage() {
  const feed = getOpportunities("home");
  return (
    <>
      <PageHero
        eyebrow="🌍 IPMD Opportunities"
        title="Bourses, concours, appels à projets & programmes"
        description="Bourses d'études, hackathons, incubateurs, financements et programmes internationaux à ne pas manquer."
      />
      {feed && (
        <Section variant="light">
          <FeedSection feed={feed} />
        </Section>
      )}
    </>
  );
}
