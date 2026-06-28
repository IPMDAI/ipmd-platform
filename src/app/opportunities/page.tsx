import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { FeedBoard } from "@/components/sections/FeedBoard";
import { resolveFeed } from "@/lib/feed-db";

export const metadata: Metadata = {
  title: "IPMD Opportunities — Bourses, concours & opportunités internationales",
  description:
    "Bourses, concours, hackathons, incubateurs, appels à projets et programmes internationaux pour développer vos compétences, votre réseau et votre avenir.",
};

export default async function OpportunitiesPage() {
  const feed = await resolveFeed("opportunities");
  return (
    <>
      <PageHero
        eyebrow="🌍 IPMD Opportunities"
        title="Bourses, concours & opportunités internationales"
        description="Découvrez les bourses, concours, hackathons, incubateurs, appels à projets et programmes internationaux pour développer vos compétences, votre réseau et votre avenir."
      />
      {feed && (
        <Section variant="light">
          <FeedBoard feed={feed} heading={false} />
        </Section>
      )}
    </>
  );
}
