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
  title: "UltraBoost — Executive Bootcamps",
  description:
    "Bootcamps certifiants UltraBoost pour cadres, dirigeants, managers et professionnels : management & IA, finance, data, RH, marketing, cybersécurité, no-code… Formats présentiel, distance, hybride et sur-mesure.",
};

export default async function UltraBoostPage() {
  const u = getUniverse("ultraboost");
  const catalog = await loadWizardCatalog();

  return (
    <>
      <PageHero
        eyebrow={`${u?.icon ?? "⚡"} ${u?.tagline ?? "Bootcamps certifiants"}`}
        title={u?.name ?? "UltraBoost"}
        description={
          u?.description ??
          "Bootcamps intensifs et certifiants pour accélérer la montée en compétence des professionnels."
        }
      >
        <div className="mt-2">
          <Button href="/admission?u=ultraboost">Demander une admission</Button>
        </div>
      </PageHero>

      <UniverseVideo universeId="ultraboost" />

      <ExperienceWorkspace universeId="ultraboost" />

      <BootcampFormulas
        universeId="ultraboost"
        dbFormulas={certFormulaItems(catalog, "ultraboost")}
        showDisclaimer={false}
      />

      <CtaBanner
        title="Prêt à booster votre carrière ?"
        description="Choisissez votre bootcamp et déposez votre demande d'admission — notre équipe vous recontacte rapidement."
        primary={{ label: "Demander une admission", href: "/admission?u=ultraboost" }}
      />
    </>
  );
}
