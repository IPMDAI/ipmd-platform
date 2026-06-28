import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { FeedBoard } from "@/components/sections/FeedBoard";
import { getJobs } from "@/data/feed";

export const metadata: Metadata = {
  title: "IPMD Jobs — Stages, emplois & missions dans le digital et l'IA",
  description:
    "Offres de stages, emplois, alternances et missions freelance proposées par IPMD, ses entreprises partenaires et le réseau UltraJobs.",
};

export default function JobsPage() {
  const feed = getJobs("home");
  return (
    <>
      <PageHero
        eyebrow="💼 IPMD Jobs"
        title="Stages, emplois & missions dans le digital et l'IA"
        description="Accédez aux offres de stages, emplois, alternances et missions freelance proposées par IPMD, ses entreprises partenaires et le réseau UltraJobs."
      />
      {feed && (
        <Section variant="light">
          <FeedBoard feed={feed} heading={false} />
          <p className="mt-8 rounded-2xl bg-white p-4 text-sm text-black/55 ring-1 ring-black/5">
            <strong className="text-ipmd-black">À noter :</strong> IPMD Jobs regroupe des offres professionnelles.
            UltraJobs est notre programme d&apos;accompagnement, de formation et d&apos;insertion — ces offres peuvent
            être alimentées par le réseau UltraJobs.
          </p>
        </Section>
      )}
    </>
  );
}
