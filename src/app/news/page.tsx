import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { FeedSection } from "@/components/sections/FeedSection";
import { getNews } from "@/data/feed";

export const metadata: Metadata = {
  title: "IPMD News — Actualités digital, IA & innovations",
  description:
    "Actualités sur le digital, l'IA, les innovations, les technologies émergentes et les annonces d'IPMD.",
};

export default function NewsPage() {
  const feed = getNews("home");
  return (
    <>
      <PageHero
        eyebrow="📰 IPMD News"
        title="Actualités digital, IA & innovations"
        description="Décryptages, tendances tech et annonces IPMD pour rester toujours à la pointe."
      />
      {feed && (
        <Section variant="light">
          <FeedSection feed={feed} />
        </Section>
      )}
    </>
  );
}
