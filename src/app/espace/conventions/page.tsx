import type { Metadata } from "next";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { ConventionSignPanel, type Submission } from "@/components/espace/conventions/ConventionSignPanel";
import { DocDownloadButton } from "@/components/espace/DocDownloadButton";

export const metadata: Metadata = { title: "Conventions à signer" };

function fmt(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

const STATUS: Record<string, { label: string; cls: string }> = {
  en_preparation: { label: "En préparation", cls: "bg-black/5 text-black/60 ring-1 ring-black/10" },
  a_signer: { label: "À signer", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  signee: { label: "Signée", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  annulee: { label: "Annulée", cls: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" },
};

type Conv = {
  id: string;
  version: number;
  status: string;
  prepared_at: string | null;
  signed_at: string | null;
  signed_submission_id: string | null;
  internships: {
    student_id: string | null;
    student_name: string | null;
    title: string | null;
    host_companies: { name: string | null } | null;
  } | null;
};

/**
 * Espace Administrateur Général — « Conventions à signer » (D8-UI-4).
 * requireAdmin : admin / super_admin uniquement. Le DÉ ne signe jamais.
 * La signature passe exclusivement par convention_sign (copie signée exacte).
 */
export default async function ConventionsPage() {
  const { supabase } = await requireAdmin();

  const { data: convsRaw } = await supabase
    .from("internship_conventions")
    .select("id, version, status, prepared_at, signed_at, signed_submission_id, internship_id, internships(student_id, student_name, title, host_companies(name))")
    .order("created_at", { ascending: false });
  const convs = (convsRaw ?? []) as unknown as Conv[];

  // Dossiers 'convention_stage' + submissions des étudiants concernés (a_signer).
  const studentIds = [...new Set(convs.filter((c) => c.status === "a_signer").map((c) => c.internships?.student_id).filter(Boolean) as string[])];
  const docByStudent = new Map<string, { docId: string; submissions: Submission[] }>();
  if (studentIds.length > 0) {
    const { data: docs } = await supabase
      .from("student_documents")
      .select("id, student_id, student_document_submissions(id, original_name, uploaded_at, status)")
      .eq("doc_key", "convention_stage")
      .in("student_id", studentIds);
    for (const d of docs ?? []) {
      const subs = ((d.student_document_submissions ?? []) as Submission[])
        .slice()
        .sort((a, b) => (b.uploaded_at ?? "").localeCompare(a.uploaded_at ?? ""));
      docByStudent.set(d.student_id as string, { docId: d.id as string, submissions: subs });
    }
  }

  // Copie signée (nom + chemin) pour les conventions signées.
  const signedIds = convs.map((c) => c.signed_submission_id).filter(Boolean) as string[];
  const signedMap = new Map<string, { original_name: string | null; path: string | null }>();
  if (signedIds.length > 0) {
    const { data: ss } = await supabase
      .from("student_document_submissions")
      .select("id, original_name, path")
      .in("id", signedIds);
    for (const s of ss ?? []) signedMap.set(s.id, { original_name: s.original_name, path: s.path });
  }

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">Conventions de stage à signer</h1>
          <p className="mt-1 text-sm text-black/55">
            Signature institutionnelle par l&apos;Administrateur Général. La copie signée exacte est
            figée et devient accessible à l&apos;étudiant une fois la convention « signée ».
          </p>

          {convs.length === 0 ? (
            <p className="mt-6 rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucune convention pour le moment.
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {convs.map((c) => {
                const st = STATUS[c.status] ?? { label: c.status, cls: "bg-black/5 text-black/60" };
                const studentId = c.internships?.student_id ?? "";
                const prep = docByStudent.get(studentId);
                const signed = c.signed_submission_id ? signedMap.get(c.signed_submission_id) : null;
                return (
                  <li key={c.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-ipmd-black">{c.internships?.student_name ?? "—"}</p>
                        <p className="mt-0.5 text-sm text-black/60">{c.internships?.title ?? "Stage"}</p>
                        <p className="mt-0.5 text-xs text-black/45">
                          {c.internships?.host_companies?.name ?? "—"} · version {c.version}
                        </p>
                      </div>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
                    </div>

                    <div className="mt-3 border-t border-black/5 pt-3 text-xs text-black/55">
                      <p>Transmise le {fmt(c.prepared_at)}{c.signed_at ? ` · Signée le ${fmt(c.signed_at)}` : ""}</p>
                    </div>

                    {c.status === "a_signer" && studentId && (
                      <div className="mt-3 border-t border-black/5 pt-3">
                        <ConventionSignPanel
                          conventionId={c.id}
                          studentId={studentId}
                          documentId={prep?.docId ?? null}
                          submissions={prep?.submissions ?? []}
                        />
                      </div>
                    )}

                    {c.status === "signee" && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-black/5 pt-3 text-sm">
                        <span className="text-black/55">Copie signée :</span>
                        <span className="font-medium text-ipmd-black">{signed?.original_name ?? "fichier"}</span>
                        {signed?.path && <DocDownloadButton path={signed.path} label="Voir la copie signée" />}
                      </div>
                    )}

                    {c.status === "en_preparation" && (
                      <p className="mt-3 border-t border-black/5 pt-3 text-xs text-black/50">
                        En préparation — à soumettre à la signature par le Directeur des Études.
                      </p>
                    )}
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
