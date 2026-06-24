import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { UniverseCard } from "@/components/cards/UniverseCard";
import { universes } from "@/data/universes";

/** Section « Nos 6 univers » : diplômes en haut, certificats en bas. */
export function UniversesSection() {
  const ordered = [
    ...universes.filter((u) => u.kind === "diplome"),
    ...universes.filter((u) => u.kind === "certificat"),
  ];

  return (
    <Section id="univers" variant="light">
      <SectionHeading
        eyebrow="Nos 6 univers"
        title="Une formation pour chaque ambition"
        description="Du bachelier au dirigeant, IPMD structure ses parcours en 6 univers complémentaires : diplômes, certificats et bootcamps spécialisés."
      />

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((universe, i) => (
          <Reveal key={universe.id} delay={i * 60}>
            <UniverseCard universe={universe} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
