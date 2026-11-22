import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { UniverseVideo } from "@/components/sections/UniverseVideo";
import { Button } from "@/components/ui/Button";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { BootcampFormulas } from "@/components/sections/BootcampFormulas";
import { ExperienceWorkspace } from "@/components/sections/ExperienceWorkspace";
import { getUniverse } from "@/data/universes";
import { loadWizardCatalog } from "@/lib/wizard-catalog";
import { certFormulaItems } from "@/components/wizard/project";

export const metadata: Metadata = {
  title: "UltraExecutive — Bootcamps dirigeants",
  description:
    "Bootcamps premium UltraExecutive pour dirigeants et décideurs : transformation digitale, stratégie IA, gouvernance, leadership, finance stratégique, cyber-résilience. Certificat d'Élite.",
};

export default async function UltraExecutivePage() {
  const u = getUniverse("ultraexecutive");
  const catalog = await loadWizardCatalog();

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

      <BootcampFormulas universeId="ultraexecutive" dbFormulas={certFormulaItems(catalog, "ultraexecutive")} />

      <CtaBanner
        title="Prêt à piloter la transformation ?"
        description="Choisissez votre programme et déposez votre demande d'admission — notre équipe vous recontacte rapidement."
        primary={{ label: "Demander une admission", href: "/admission?u=ultraexecutive" }}
      />
    </>
  );
}
