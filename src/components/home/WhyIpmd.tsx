import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

const reasons = [
  {
    icon: "🛠️",
    title: "80 % de pratique",
    desc: "Des projets réels, des cas concrets et des mises en situation dès le premier jour.",
  },
  {
    icon: "🤖",
    title: "Orienté IA",
    desc: "L'intelligence artificielle est intégrée à tous les parcours et métiers du digital.",
  },
  {
    icon: "💼",
    title: "Employabilité",
    desc: "Des compétences directement recherchées par les entreprises et le marché.",
  },
  {
    icon: "🧩",
    title: "Parcours modulaires",
    desc: "Diplômes et bootcamps, de la formation initiale jusqu'aux dirigeants.",
  },
  {
    icon: "🌍",
    title: "100 % digital",
    desc: "Une pédagogie moderne, flexible et accessible, pensée mobile et web.",
  },
  {
    icon: "🚀",
    title: "Esprit d'impact",
    desc: "Ose. Agis. Impacte. : une culture de l'audace et du passage à l'action.",
  },
];

/** Section « Pourquoi choisir IPMD ». */
export function WhyIpmd() {
  return (
    <Section variant="light">
      <SectionHeading
        eyebrow="Pourquoi IPMD"
        title="Une école pensée pour l'impact"
        description="Une pédagogie pratique, moderne et orientée résultats, du premier diplôme jusqu'à la gouvernance."
      />

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reasons.map((reason, i) => (
          <Reveal key={reason.title} delay={i * 50}>
            <div className="flex h-full flex-col rounded-2xl bg-white p-7 shadow-sm ring-1 ring-black/5">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ipmd-red/10 text-2xl">
                {reason.icon}
              </span>
              <h3 className="mt-5 text-lg font-bold text-ipmd-black">
                {reason.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-black/60">
                {reason.desc}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
