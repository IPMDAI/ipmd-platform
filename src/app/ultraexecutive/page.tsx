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
  title: "UltraExecutive — Bootcamps dirigeants",
  description:
    "Bootcamps premium UltraExecutive pour dirigeants et décideurs : transformation digitale, stratégie IA, gouvernance, leadership, finance stratégique, cyber-résilience. Certificat d'Élite.",
};

export default async function UltraExecutivePage() {
  const u = getUniverse("ultraexecutive");
  const catalog = await loadWizardCatalog();
  const items = certUniqueItems(catalog, "ultraexecutive");

  return (
    <>
      <PageHero
        eyebrow={`${u?.icon ?? "👑"} ${u?.tagline ?? "Bootcamps premium — dirigeants"}`}
        title={u?.name ?? "UltraExecutive"}
        description={
          u?.description ??
          "Bootcamps premium pour accompagner les dirigeants dans la transformation digitale, l'IA et la gouvernance."
        }
      >
        <div className="mt-2">
          <Button href="/admission?u=ultraexecutive">Demander une admission</Button>
        </div>
      </PageHero>

      <UniverseVideo universeId="ultraexecutive" />

      <ExperienceWorkspace universeId="ultraexecutive" />

      <Section variant="white">
        <h2 className="text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">
          Nos bootcamps premium pour dirigeants
        </h2>
        <p className="mt-2 max-w-2xl text-black/60">
          Des programmes exécutifs, intensifs et orientés décision — pour dirigeants et décideurs.
        </p>
        <div className="mt-10">
          <UltraJobsCatalog items={items} universe="ultraexecutive" />
        </div>
      </Section>

      <CtaBanner
        title="Prêt à piloter la transformation ?"
        description="Choisissez votre programme et déposez votre demande d'admission — notre équipe vous recontacte rapidement."
        primary={{ label: "Demander une admission", href: "/admission?u=ultraexecutive" }}
      />
    </>
  );
}
