import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { UniverseVideo } from "@/components/sections/UniverseVideo";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { UltraJobsCatalog } from "@/components/ultrajobs/UltraJobsCatalog";
import { ExperienceWorkspace } from "@/components/sections/ExperienceWorkspace";
import { getUniverse } from "@/data/universes";
import { loadWizardCatalog } from "@/lib/wizard-catalog";
import { certUniqueItems } from "@/components/wizard/project";

export const metadata: Metadata = {
  title: "SeniorsHub — Bootcamps certifiants pour seniors & experts",
  description:
    "Bootcamps certifiants SeniorsHub pour seniors, retraités et professionnels expérimentés : IA & e-business, valorisation de l'expertise, compétences numériques essentielles. Certificat de Compétence.",
};

export default async function SeniorsHubPage() {
  const u = getUniverse("seniorshub");
  const catalog = await loadWizardCatalog();
  const items = certUniqueItems(catalog, "seniorshub");

  return (
    <>
      <PageHero
        eyebrow={`${u?.icon ?? "🌟"} ${u?.tagline ?? "Bootcamps certifiants — seniors & experts"}`}
        title={u?.name ?? "SeniorsHub"}
        description={
          u?.description ??
          "Pour les seniors, retraités et professionnels expérimentés qui souhaitent apprendre le digital, l'IA et l'e-business, afin de valoriser et transmettre leur expertise."
        }
      >
        <div className="mt-2">
          <Button href="/admission?u=seniorshub">Demander une admission</Button>
        </div>
      </PageHero>

      <UniverseVideo universeId="seniorshub" />

      <Section variant="white">
        <h2 className="text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">
          Nos bootcamps certifiants pour seniors & experts
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-black/60">
          Des parcours courts et concrets, sans prérequis académique, pensés pour un rythme
          accessible. Chaque programme délivre un <strong>Certificat de Compétence</strong>,
          se déroule sur <strong>3 mois</strong> et se choisit en présentiel, à distance ou en hybride.
        </p>
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-black/70">
          <li>✓ Certificat de Compétence</li>
          <li>✓ Durée : 3 mois</li>
          <li>✓ Formation : 385 000 FCFA</li>
          <li>✓ Frais d'inscription : 100 000 FCFA</li>
        </ul>
        <div className="mt-10">
          <UltraJobsCatalog items={items} universe="seniorshub" />
        </div>
      </Section>

      <ExperienceWorkspace universeId="seniorshub" />

      <CtaBanner
        title="Prêt à valoriser votre expérience ?"
        description="Choisissez votre programme et déposez votre demande d'admission — notre équipe vous accompagne pas à pas."
        primary={{ label: "Demander une admission", href: "/admission?u=seniorshub" }}
      />
    </>
  );
}
