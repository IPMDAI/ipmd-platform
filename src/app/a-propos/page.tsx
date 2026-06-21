import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { AboutSection } from "@/components/home/AboutSection";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "IPMD — Institut Polytechnique des Métiers du Digital. École supérieure digitale, pratique et orientée intelligence artificielle.",
};

const values = [
  {
    icon: "🎯",
    title: "Ose",
    desc: "Nous encourageons l'audace, l'initiative et la prise de risque maîtrisée.",
  },
  {
    icon: "⚙️",
    title: "Agis",
    desc: "La pratique avant tout : 80 % de mise en situation et de projets réels.",
  },
  {
    icon: "🌍",
    title: "Impacte",
    desc: "Former des talents qui transforment les entreprises et la société.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="À propos"
        title="L'école des métiers du digital"
        description="IPMD — Institut Polytechnique des Métiers du Digital — est une école supérieure moderne, pratique et orientée intelligence artificielle."
      />

      {/* Présentation détaillée de l'institut */}
      <AboutSection showHeading={false} />

      {/* Valeurs */}
      <Section variant="light">
        <SectionHeading
          eyebrow="Notre devise"
          title="Ose. Agis. Impacte."
          description="Trois mots qui résument l'état d'esprit IPMD."
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {values.map((value, i) => (
            <Reveal key={value.title} delay={i * 60}>
              <div className="flex h-full flex-col items-center rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ipmd-red/10 text-3xl">
                  {value.icon}
                </span>
                <h3 className="mt-5 text-xl font-extrabold text-ipmd-black">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-black/60">
                  {value.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Positionnement */}
      <Section variant="dark" contained>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Une école <span className="text-ipmd-red-light">digitale</span> et{" "}
            <span className="text-ipmd-red-light">augmentée par l'IA</span>
          </h2>
          <p className="mt-5 text-lg text-white/70">
            De la formation initiale à la gouvernance, IPMD accompagne chaque
            profil — étudiants, professionnels, parents, enseignants, dirigeants
            et administration — avec une pédagogie moderne et une intelligence
            artificielle éducative.
          </p>
        </div>
      </Section>

      <CtaBanner
        title="Rejoignez l'aventure IPMD"
        description="Construisez votre avenir dans les métiers du digital. Ose. Agis. Impacte."
      />
    </>
  );
}
