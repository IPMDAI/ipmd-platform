import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { UniverseVideo } from "@/components/sections/UniverseVideo";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { UltraBoostCatalog } from "@/components/ultraboost/UltraBoostCatalog";
import { ExperienceWorkspace } from "@/components/sections/ExperienceWorkspace";
import { getUniverse } from "@/data/universes";

export const metadata: Metadata = {
  title: "UltraBoost — Executive Bootcamps",
  description:
    "Bootcamps certifiants UltraBoost pour cadres, dirigeants, managers et professionnels : management & IA, finance, data, RH, marketing, cybersécurité, no-code… Formats présentiel, distance, hybride et sur-mesure.",
};

export default function UltraBoostPage() {
  const u = getUniverse("ultraboost");

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
          <Button href="/inscription-bootcamp?u=ultraboost">Demander une admission</Button>
        </div>
      </PageHero>

      <UniverseVideo universeId="ultraboost" />

      <ExperienceWorkspace universeId="ultraboost" />

      <Section variant="dark">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-wide text-ipmd-black">
            Pour cadres &amp; professionnels
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Nos Executive Bootcamps
          </h2>
        </div>
        <p className="mt-3 max-w-2xl text-white/65">
          Des bootcamps certifiants, intensifs et 100&nbsp;% pratiques pour cadres, dirigeants, managers et
          professionnels.
        </p>
        <div className="mt-10">
          <UltraBoostCatalog />
        </div>
      </Section>

      <CtaBanner
        title="Prêt à booster votre carrière ?"
        description="Choisissez votre bootcamp et déposez votre demande d'admission — notre équipe vous recontacte rapidement."
        primary={{ label: "Demander une admission", href: "/inscription-bootcamp?u=ultraboost" }}
      />
    </>
  );
}
