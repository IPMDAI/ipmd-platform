import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { UniverseVideo } from "@/components/sections/UniverseVideo";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { UltraJobsCatalog } from "@/components/ultrajobs/UltraJobsCatalog";
import { getUniverse } from "@/data/universes";

export const metadata: Metadata = {
  title: "UltraJobs — Bootcamps métiers à l'ère de l'IA",
  description:
    "Des bootcamps certifiants et 100% pratiques pour les jeunes de 18 à 30 ans, organisés par métier : marketing, design, dev, IA, data, e-commerce, support et transformation digitale.",
};

export default function UltraJobsPage() {
  const u = getUniverse("ultrajobs");

  return (
    <>
      <PageHero
        eyebrow={`${u?.icon ?? "🚀"} ${u?.tagline ?? "Bootcamps jeunes à l'ère de l'IA"}`}
        title={u?.name ?? "UltraJobs"}
        description={
          u?.description ??
          "Des bootcamps certifiants, courts et 100% pratiques pour devenir employable et opérationnel dans les métiers du digital et de l'IA."
        }
      >
        <div className="mt-2">
          <Button href="/inscription-bootcamp?u=ultrajobs">Demander une admission</Button>
        </div>
      </PageHero>

      <UniverseVideo universeId="ultrajobs" />

      <Section variant="light">
        <h2 className="text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">
          Nos bootcamps métiers, par domaine
        </h2>
        <p className="mt-2 max-w-2xl text-black/60">
          Des formats courts, intensifs et orientés résultats — un métier concret, prêt pour l&apos;emploi.
        </p>
        <div className="mt-10">
          <UltraJobsCatalog />
        </div>
      </Section>

      <CtaBanner
        title="Prêt à décrocher votre métier digital ?"
        description="Choisissez votre bootcamp et déposez votre demande d'admission — formation courte, certifiante et orientée employabilité."
        primary={{ label: "Demander une admission", href: "/inscription-bootcamp?u=ultrajobs" }}
      />
    </>
  );
}
