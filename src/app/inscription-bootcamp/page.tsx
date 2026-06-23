import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { BootcampInscriptionForm } from "@/components/forms/BootcampInscriptionForm";
import { getUniverse } from "@/data/universes";

export const metadata: Metadata = {
  title: "Inscription bootcamp",
  description:
    "Demande d'inscription simplifiée aux bootcamps certifiants IPMD (UltraJobs, UltraBoost, UltraExecutive).",
};

export default async function BootcampInscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string }>;
}) {
  const { u } = await searchParams;
  const universe = u ? getUniverse(u) : undefined;
  const defaultUniverse =
    universe && universe.kind === "certificat" ? universe.id : "";

  return (
    <>
      <PageHero
        eyebrow="Bootcamps certifiants"
        title="Inscription rapide"
        description="Un formulaire court pour rejoindre nos bootcamps intensifs. Pas de dossier compliqué — l'essentiel, et notre équipe vous recontacte vite."
      />

      <Section variant="white">
        <div className="mx-auto max-w-2xl rounded-3xl bg-ipmd-light p-7 shadow-sm ring-1 ring-black/5 sm:p-9">
          <h2 className="text-xl font-extrabold tracking-tight text-ipmd-black">
            Formulaire de demande
            {universe ? ` — ${universe.name}` : ""}
          </h2>
          <p className="mt-1 text-sm text-black/60">
            Les champs marqués d&apos;un <span className="text-ipmd-red">*</span>{" "}
            sont obligatoires.
          </p>
          <div className="mt-6">
            <BootcampInscriptionForm defaultUniverse={defaultUniverse} />
          </div>
        </div>
      </Section>
    </>
  );
}
