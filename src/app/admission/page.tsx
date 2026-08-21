import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { InscriptionForm, type OpenIntake } from "@/components/forms/InscriptionForm";
import { createClient } from "@/lib/supabase/server";

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
    desc: "Constitution du dossier et confirmation de votre admission.",
  },
  {
    n: "4",
    title: "Rentrée",
    desc: "Vous démarrez votre parcours avec 80 % de pratique.",
  },
];

export default async function AdmissionPage() {
  // Rentrées ouvertes + leurs OFFRES ouvertes (filière + niveau réels).
  // Lisibles en anon via les policies « open ». L'année de candidature vient de la
  // rentrée choisie (jamais de finance_settings), et la formation vient de l'offre.
  let openIntakes: OpenIntake[] = [];
  const supabase = await createClient();
  if (supabase) {
    const [{ data: intakeData }, { data: offerData }, { data: filiereData }] = await Promise.all([
      supabase
        .from("intakes")
        .select("id, label, academic_year, start_date, sort_order")
        .eq("status", "open")
        .order("academic_year", { ascending: false })
        .order("sort_order"),
      supabase.from("intake_offerings").select("intake_id, filiere_id, level").eq("status", "open"),
      supabase.from("filieres").select("id, name"),
    ]);
    const filiereName = new Map((filiereData ?? []).map((f) => [f.id as string, f.name as string]));
    const offersByIntake = new Map<string, { filiereId: string; filiereName: string; level: string }[]>();
    for (const o of offerData ?? []) {
      const arr = offersByIntake.get(o.intake_id as string) ?? [];
      arr.push({
        filiereId: o.filiere_id as string,
        filiereName: filiereName.get(o.filiere_id as string) ?? "(filière)",
        level: o.level as string,
      });
      offersByIntake.set(o.intake_id as string, arr);
    }
    openIntakes = (intakeData ?? [])
      .map((i) => ({
        id: i.id as string,
        label: i.label as string,
        academicYear: i.academic_year as string,
        startDate: (i.start_date as string) ?? null,
        offerings: (offersByIntake.get(i.id as string) ?? []).sort((a, b) =>
          (a.filiereName + a.level).localeCompare(b.filiereName + b.level)
        ),
      }))
      // Une rentrée sans offre ouverte n'est pas proposable (cohérence funnel).
      .filter((i) => i.offerings.length > 0);
  }

  return (
    <>
      <PageHero
        eyebrow="Admission"
        title="Demande d'admission"
        description="Rejoignez l'IPMD en quelques étapes simples. Remplissez le formulaire, notre équipe vous recontactera rapidement."
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
              Formulaire de demande d'admission
            </h2>
            <p className="mt-1 text-sm text-black/60">
              Les champs marqués d'un <span className="text-ipmd-red">*</span>{" "}
              sont obligatoires.
            </p>
            <div className="mt-6">
              <InscriptionForm openIntakes={openIntakes} />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
