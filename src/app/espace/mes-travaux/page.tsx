import type { Metadata } from "next";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { DocumentUpload } from "@/components/espace/DocumentUpload";
import { WORK_TYPE_LABEL, WORK_STATUS, type WorkStatus } from "@/lib/academic-works";

export const metadata: Metadata = { title: "Mes travaux" };

type MyWork = {
  id: string;
  work_type: string;
  title: string | null;
  status: string;
  academic_year: string | null;
  academic_advisor_name: string | null;
  student_document_id: string | null;
};

/**
 * Espace étudiant — « Mes travaux » (D8-UI-2). Lecture EXCLUSIVEMENT via la RPC
 * student_my_academic_works(). Le dépôt du fichier réutilise strictement le
 * système documentaire existant (DocumentUpload → submitDocument → même bucket).
 * Les états depose / a_corriger / valide sont décidés par la base, jamais ici.
 */
export default async function MesTravauxPage() {
  const { supabase, userId } = await requireUser();
  const { data } = await supabase.rpc("student_my_academic_works");
  const works = (data ?? []) as MyWork[];

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">Mes travaux</h1>
          <p className="mt-1 text-sm text-black/55">
            Mémoire, rapport de stage, PFE : déposez vos fichiers quand le dépôt est ouvert.
          </p>

          {works.length === 0 ? (
            <p className="mt-6 rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucun travail enregistré pour le moment.
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {works.map((w) => {
                const badge = WORK_STATUS[w.status as WorkStatus];
                const canDeposit =
                  !!w.student_document_id && (w.status === "a_deposer" || w.status === "a_corriger");
                return (
                  <li key={w.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-ipmd-black">{w.title ?? "Travail"}</p>
                        <p className="mt-0.5 text-sm text-black/55">
                          {WORK_TYPE_LABEL[w.work_type] ?? w.work_type}
                          {w.academic_year ? ` · ${w.academic_year}` : ""}
                        </p>
                      </div>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge?.cls ?? ""}`}>
                        {badge?.label ?? w.status}
                      </span>
                    </div>

                    <div className="mt-3 border-t border-black/5 pt-3 text-xs text-black/55">
                      <p>Encadreur : <strong>{w.academic_advisor_name ?? "à venir"}</strong></p>
                    </div>

                    <div className="mt-3">
                      {w.status === "brouillon" && (
                        <p className="text-xs text-black/50">Le dépôt n&apos;est pas encore ouvert.</p>
                      )}
                      {w.status === "depose" && (
                        <p className="text-xs text-sky-700">Version déposée — en attente de la relecture.</p>
                      )}
                      {w.status === "a_corriger" && (
                        <p className="text-xs text-orange-700">
                          Corrections demandées — déposez une nouvelle version.
                        </p>
                      )}
                      {w.status === "valide" && (
                        <p className="text-xs font-medium text-emerald-600">Travail validé ✅</p>
                      )}
                      {canDeposit && (
                        <div className="mt-2">
                          <DocumentUpload
                            studentId={userId}
                            studentDocumentId={w.student_document_id as string}
                            label={w.title ?? "travail"}
                          />
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}
