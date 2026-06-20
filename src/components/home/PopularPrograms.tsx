import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ProgramCard } from "@/components/cards/ProgramCard";
import { Button } from "@/components/ui/Button";
import { programs } from "@/data/programs";

/** Section « Formations populaires » (échantillon Campus). */
export function PopularPrograms() {
  const popular = programs
    .filter((p) => p.universe === "campus")
    .slice(0, 6);

  return (
    <Section variant="white">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <SectionHeading
          align="left"
          eyebrow="Formations populaires"
          title="Les parcours les plus demandés"
          description="Un aperçu des formations diplômantes IPMD Campus, du marketing à l'intelligence artificielle."
        />
        <Button href="/formations" variant="outline" className="shrink-0">
          Toutes les formations →
        </Button>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {popular.map((program, i) => (
          <Reveal key={program.id} delay={i * 50}>
            <ProgramCard program={program} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
