import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { UniverseVideo } from "@/components/sections/UniverseVideo";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { UltraBoostCatalog } from "@/components/ultraboost/UltraBoostCatalog";
import { getUniverse } from "@/data/universes";

export const metadata: Metadata = {
  title: "UltraBoost — VIP Bootcamps",
  description:
    "Bootcamps certifiants UltraBoost — du niveau SPECIALIST à EXECUTIVE : marketing, IA, data, dev, finance… Formats présentiel, distance, hybride et VIP.",
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

      <Section variant="white">
        <h2 className="text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">
          Nos VIP Bootcamps
        </h2>
        <p className="mt-2 max-w-2xl text-black/60">
          Des bootcamps certifiants par niveau d&apos;expertise — du SPECIALIST à l&apos;EXECUTIVE.
        </p>
        <div className="mt-8">
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
