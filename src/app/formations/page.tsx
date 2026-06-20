import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { UniverseCard } from "@/components/cards/UniverseCard";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { universes } from "@/data/universes";

export const metadata: Metadata = {
  title: "Formations",
  description:
    "Toutes les formations IPMD : diplômes (Campus, Professionnel, Gouvernance) et bootcamps certifiants (UltraJobs, UltraBoost, UltraExecutive).",
};

export default function FormationsPage() {
  const diplomas = universes.filter((u) => u.kind === "diplome");
  const certificates = universes.filter((u) => u.kind === "certificat");

  return (
    <>
      <PageHero
        eyebrow="Catalogue"
        title="Toutes nos formations"
        description="Diplômes et bootcamps certifiants, organisés en 6 univers — de la formation initiale jusqu'à la gouvernance."
      />

      <Section variant="light">
        <h2 className="text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">
          🎓 Diplômes
        </h2>
        <p className="mt-2 max-w-2xl text-black/60">
          Licence, Bachelor, Master, MBA et programmes exécutifs.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {diplomas.map((u, i) => (
            <Reveal key={u.id} delay={i * 50}>
              <UniverseCard universe={u} />
            </Reveal>
          ))}
        </div>
      </Section>

      <Section variant="white">
        <h2 className="text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">
          ⚡ Bootcamps certifiants
        </h2>
        <p className="mt-2 max-w-2xl text-black/60">
          Des formats courts, intensifs et orientés emploi ou performance.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((u, i) => (
            <Reveal key={u.id} delay={i * 50}>
              <UniverseCard universe={u} />
            </Reveal>
          ))}
        </div>

        <div className="mt-12 rounded-3xl bg-ipmd-light p-8 text-center sm:p-10">
          <p className="text-lg font-semibold text-ipmd-black">
            Vous hésitez sur le bon parcours ?
          </p>
          <p className="mt-2 text-black/60">
            Explorez chaque univers en détail ou contactez notre équipe
            d'admission.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {universes.map((u) => (
              <Link
                key={u.id}
                href={u.href}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ipmd-black shadow-sm ring-1 ring-black/5 transition-colors hover:text-ipmd-red"
              >
                {u.icon} {u.name}
              </Link>
            ))}
          </div>
        </div>
      </Section>

      <CtaBanner
        title="Trouvez la formation qui vous correspond"
        description="Déposez une demande d'inscription et laissez-vous guider par nos conseillers."
      />
    </>
  );
}
