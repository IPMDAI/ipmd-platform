import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { PageHero } from "@/components/sections/PageHero";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { ProgramCard } from "@/components/cards/ProgramCard";
import { BootcampCard } from "@/components/cards/BootcampCard";
import { Button } from "@/components/ui/Button";
import { getUniverse } from "@/data/universes";
import { getProgramsByUniverse } from "@/data/programs";
import { getBootcampsByUniverse } from "@/data/bootcamps";
import type { UniverseId } from "@/types";

/**
 * Page complète d'un univers : en-tête, infos clés, grille de programmes ou
 * de bootcamps, puis appel à l'action. Mutualise la mise en page des 6 pages.
 */
export function UniverseShowcase({ universeId }: { universeId: UniverseId }) {
  const universe = getUniverse(universeId);
  if (!universe) return null;

  const programs = getProgramsByUniverse(universeId);
  const bootcamps = getBootcampsByUniverse(universeId);
  const isDiploma = universe.kind === "diplome";

  return (
    <>
      <PageHero
        eyebrow={`${universe.icon} ${universe.tagline}`}
        title={universe.name}
        description={universe.description}
      >
        <div className="flex flex-wrap gap-2">
          {universe.credentials.map((c) => (
            <span
              key={c}
              className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/20"
            >
              {c}
            </span>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <Button href="/admission">Demander une inscription</Button>
          {universe.subdomain && (
            <span className="inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-sm text-white/60">
              Bientôt&nbsp;: {universe.subdomain}
            </span>
          )}
        </div>
      </PageHero>

      {/* Public visé */}
      <Section variant="white">
        <div className="grid gap-8 rounded-3xl bg-ipmd-light p-8 sm:grid-cols-2 sm:p-10">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-ipmd-red">
              À qui s'adresse cet univers ?
            </h2>
            <p className="mt-2 text-lg font-semibold text-ipmd-black">
              {universe.audience}
            </p>
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-ipmd-red">
              Ce que vous obtenez
            </h2>
            <p className="mt-2 text-lg font-semibold text-ipmd-black">
              {universe.credentials.join(" · ")}
            </p>
          </div>
        </div>
      </Section>

      {/* Programmes ou bootcamps */}
      <Section variant="light">
        <h2 className="text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">
          {isDiploma ? "Nos formations diplômantes" : "Nos bootcamps certifiants"}
        </h2>
        <p className="mt-2 max-w-2xl text-black/60">
          {isDiploma
            ? "Des parcours diplômants conçus avec 80 % de pratique."
            : "Des formats courts, intensifs et orientés résultats."}
        </p>

        {isDiploma ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((program, i) => (
              <Reveal key={program.id} delay={i * 40}>
                <ProgramCard program={program} />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bootcamps.map((bootcamp, i) => (
              <Reveal key={bootcamp.id} delay={i * 40}>
                <BootcampCard bootcamp={bootcamp} />
              </Reveal>
            ))}
          </div>
        )}
      </Section>

      <CtaBanner
        title="Prêt à rejoindre IPMD ?"
        description="Déposez votre demande d'inscription : notre équipe vous recontacte rapidement pour construire votre parcours."
      />
    </>
  );
}
