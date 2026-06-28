import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { FeedBoard } from "@/components/sections/FeedBoard";
import { resolveFeed } from "@/lib/feed-db";

export const metadata: Metadata = {
  title: "IPMD News — Actualités Digital, IA & Métiers d'avenir",
  description:
    "Décryptages, tendances, innovations et annonces IPMD pour comprendre les métiers de demain et rester à la pointe du digital et de l'IA.",
};

export default async function NewsPage() {
  const feed = await resolveFeed("news");
  return (
    <>
      <PageHero
        eyebrow="📰 IPMD News"
        title="Actualités Digital, IA & Métiers d'avenir"
        description="Décryptages, tendances, innovations et annonces IPMD pour comprendre les métiers de demain et rester à la pointe du digital et de l'IA."
      />
      {feed && (
        <Section variant="light">
          <FeedBoard feed={feed} heading={false} />
        </Section>
      )}
    </>
  );
}
