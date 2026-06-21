import type { Metadata } from "next";
import { PageHero } from "@/components/sections/PageHero";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import {
  computerSpecs,
  documentsNote,
  dressCode,
  enrollmentNotes,
  feeColumns,
  feeRows,
  requiredDocuments,
} from "@/data/scolarite";

export const metadata: Metadata = {
  title: "Scolarité & financement",
  description:
    "Frais de scolarité, échéanciers et versements (FCFA), documents requis, matériel et conditions d'admission à l'IPMD.",
};

export default function ScolaritePage() {
  return (
    <>
      <PageHero
        eyebrow="Scolarité"
        title="Frais de scolarité & financement"
        description="Diplômes ivoiriens — échéanciers, versements, documents requis et conditions d'admission."
      />

      {/* Tableau des frais */}
      <Section variant="light">
        <h2 className="text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">
          Frais de scolarité — échéanciers & versements
        </h2>
        <p className="mt-2 text-black/60">
          Montants en FCFA. La scolarité peut être réglée en 10 versements.
        </p>

        <div className="mt-8 overflow-x-auto rounded-2xl ring-1 ring-black/10">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="bg-ipmd-red text-white">
                <th className="px-3 py-3 text-left font-bold">Diplôme</th>
                {feeColumns.map((col) => (
                  <th key={col.label} className="px-3 py-3 text-center font-bold">
                    <div>{col.label}</div>
                    <div className="text-xs font-medium text-white/80">
                      {col.pct}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {feeRows.map((row, i) => (
                <tr
                  key={row.level}
                  className={i % 2 === 0 ? "bg-white" : "bg-ipmd-light"}
                >
                  <th className="whitespace-nowrap px-3 py-3 text-left font-bold text-ipmd-black">
                    {row.level}
                  </th>
                  {row.values.map((value, j) => (
                    <td
                      key={j}
                      className={`whitespace-nowrap px-3 py-3 text-center ${
                        j === 0
                          ? "font-bold text-ipmd-red"
                          : "text-black/70"
                      }`}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Notes inscription / paiement */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {enrollmentNotes.map((note) => (
            <p
              key={note}
              className="rounded-2xl bg-white p-4 text-sm font-medium text-ipmd-black shadow-sm ring-1 ring-black/5"
            >
              {note}
            </p>
          ))}
        </div>
      </Section>

      {/* Documents requis */}
      <Section variant="white">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">
              Documents requis
            </h2>
            <ul className="mt-6 space-y-2.5">
              {requiredDocuments.map((doc) => (
                <li
                  key={doc}
                  className="flex items-start gap-3 text-sm leading-relaxed text-black/75"
                >
                  <span className="mt-0.5 text-ipmd-red" aria-hidden>
                    ✓
                  </span>
                  {doc}
                </li>
              ))}
            </ul>
            <p className="mt-5 rounded-2xl bg-ipmd-red/10 p-4 text-sm leading-relaxed text-ipmd-red-dark">
              <span className="font-bold">NB : </span>
              {documentsNote}
            </p>
          </div>

          {/* Matériel + tenue */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-ipmd-light p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold text-ipmd-black">
                💻 Matériel requis
              </h3>
              <p className="mt-2 text-sm text-black/70">
                Caractéristiques minimales de l&apos;ordinateur :
              </p>
              <p className="mt-1 font-semibold text-ipmd-black">
                {computerSpecs}
              </p>
            </div>

            <div className="rounded-3xl bg-ipmd-light p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold text-ipmd-black">
                👔 Tenue vestimentaire
              </h3>
              <p className="mt-1 text-xs text-black/50">
                Exigée pour les étudiants en journée.
              </p>
              <ul className="mt-3 space-y-2.5">
                {dressCode.map((d) => (
                  <li key={d.day} className="text-sm">
                    <span className="font-bold text-ipmd-black">{d.day} : </span>
                    <span className="text-black/70">{d.rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section variant="light" className="text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">
          Prêt à candidater ?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-black/60">
          Déposez votre demande de candidature : notre équipe vous accompagne
          dans le choix de votre parcours et le financement.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-4">
          <Button href="/admission" size="lg">
            Déposer ma candidature
          </Button>
          <Button href="/contact" size="lg" variant="outline">
            Nous contacter
          </Button>
        </div>
      </Section>
    </>
  );
}
