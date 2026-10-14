import type { Metadata } from "next";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { DocDownloadButton } from "@/components/espace/DocDownloadButton";
import { INTERNSHIP_STATUS, type InternshipStatus } from "@/lib/internships";

export const metadata: Metadata = { title: "Mon stage" };

function fmt(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return "—";
  }
}

type MyInternship = {
  id: string;
  title: string | null;
  mission: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  company_name: string | null;
  company_city: string | null;
  academic_advisor_name: string | null;
  module_name: string | null;
  supervisor_name: string | null;
  supervisor_function: string | null;
  convention_status: string | null;
};

/**
 * Espace étudiant — « Mon stage » (D8-UI-1). Lecture EXCLUSIVEMENT via la RPC
 * `student_my_internships()` (SECURITY DEFINER) : uniquement SON stage, champs
 * utiles seulement. Aucune note interne, aucune donnée d'administration, aucune
 * action pédagogique ou administrative.
 */
export default async function MonStagePage() {
  const { supabase } = await requireUser();
  const { data } = await supabase.rpc("student_my_internships");
  const stages = (data ?? []) as MyInternship[];

  // Convention SIGNÉE uniquement : la RLS (D8-5) ne rend visibles le dossier
  // 'convention_stage' et sa submission QUE lorsque la convention est signée,
  // et seulement la version exacte signée (jamais brouillon/autre version).
  const { data: convDocs } = await supabase
    .from("student_documents")
    .select("student_document_submissions(id, original_name, path)")
    .eq("doc_key", "convention_stage");
  const signedConventions = (convDocs ?? [])
    .flatMap((d) => (d.student_document_submissions ?? []) as { id: string; original_name: string | null; path: string | null }[])
    .filter((s) => !!s.path);

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">Mon stage</h1>
          <p className="mt-1 text-sm text-black/55">
            Les informations de votre stage, suivies par la pédagogie.
          </p>

          {stages.length === 0 ? (
            <p className="mt-6 rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucun stage enregistré pour le moment.
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {stages.map((s) => {
                const badge = INTERNSHIP_STATUS[s.status as InternshipStatus];
                const signed = s.convention_status === "signee";
                return (
                  <li key={s.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-bold text-ipmd-black">{s.title ?? "Stage"}</p>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge?.cls ?? ""}`}>
                        {badge?.label ?? s.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-black/60">
                      {s.company_name ?? "—"}
                      {s.company_city ? ` · ${s.company_city}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-black/45">
                      {fmt(s.start_date)} → {fmt(s.end_date)}
                      {s.module_name ? ` · ${s.module_name}` : ""}
                    </p>
                    {s.mission && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-black/70">{s.mission}</p>
                    )}
                    <div className="mt-3 border-t border-black/5 pt-3 text-xs text-black/55 space-y-0.5">
                      <p>
                        Encadreur académique : <strong>{s.academic_advisor_name ?? "à venir"}</strong>
                      </p>
                      {(s.supervisor_name || s.supervisor_function) && (
                        <p>
                          Maître de stage : {s.supervisor_name ?? "—"}
                          {s.supervisor_function ? ` (${s.supervisor_function})` : ""}
                        </p>
                      )}
                      <p>
                        Convention :{" "}
                        {signed ? (
                          <strong className="text-emerald-600">signée ✅</strong>
                        ) : (
                          <span className="text-black/50">en préparation</span>
                        )}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {signedConventions.length > 0 && (
            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h2 className="text-base font-bold text-ipmd-black">Ma convention signée</h2>
              <p className="mt-0.5 text-xs text-black/50">Version officielle signée par l&apos;administration.</p>
              <ul className="mt-3 space-y-2">
                {signedConventions.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-ipmd-black">{s.original_name ?? "Convention signée"}</span>
                    {s.path && <DocDownloadButton path={s.path} label="Télécharger" />}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
