import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { InscriptionForm } from "@/components/forms/InscriptionForm";

export const metadata: Metadata = {
  title: "Admission / Inscription",
  description:
    "Déposez votre demande d'inscription à IPMD. Processus simple en quelques étapes.",
};

const steps = [
  {
    n: "1",
    title: "Demande en ligne",
    desc: "Remplissez le formulaire ci-contre en quelques minutes.",
  },
  {
    n: "2",
    title: "Échange conseil",
    desc: "Un conseiller vous contacte pour valider votre projet.",
  },
  {
    n: "3",
    title: "Dossier & admission",
    desc: "Constitution du dossier et confirmation de votre place.",
  },
  {
    n: "4",
    title: "Rentrée",
    desc: "Vous démarrez votre parcours avec 80 % de pratique.",
  },
];

export default function AdmissionPage() {
  return (
    <>
      <PageHero
        eyebrow="Admission"
        title="Demande d'inscription"
        description="Rejoignez IPMD en quelques étapes simples. Remplissez le formulaire, notre équipe vous recontacte rapidement."
      />

      <Section variant="white">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
          {/* Étapes */}
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-ipmd-black">
              Comment ça marche ?
            </h2>
            <ol className="mt-8 space-y-6">
              {steps.map((step) => (
                <li key={step.n} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ipmd-red font-bold text-white">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="font-bold text-ipmd-black">{step.title}</h3>
                    <p className="mt-1 text-sm text-black/60">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Formulaire */}
          <div className="rounded-3xl bg-ipmd-light p-7 shadow-sm ring-1 ring-black/5 sm:p-9">
            <h2 className="text-xl font-extrabold tracking-tight text-ipmd-black">
              Formulaire de demande
            </h2>
            <p className="mt-1 text-sm text-black/60">
              Les champs marqués d'un <span className="text-ipmd-red">*</span>{" "}
              sont obligatoires.
            </p>
            <div className="mt-6">
              <InscriptionForm />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
