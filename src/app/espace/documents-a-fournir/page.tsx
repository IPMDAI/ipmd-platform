import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { RequiredDocForm } from "@/components/espace/RequiredDocForm";
import { DocReview } from "@/components/espace/DocReview";
import { DocDownloadButton } from "@/components/espace/DocDownloadButton";
import { PARENT_RELATIONSHIP_LABEL } from "@/lib/academic";
import {
  DOC_STATUS,
  type StudentDocument,
  type DocSubmission,
} from "@/lib/student-documents";

export const metadata: Metadata = { title: "Documents à fournir" };

function frDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function DocumentsAFournirPage() {
  const { supabase } = await requireAdmin();

  const [{ data: students }, { data: docTypes }, { data: docs }, { data: subs }] =
    await Promise.all([
      supabase.from("profiles").select("id, full_name, email").eq("role", "etudiant").order("full_name"),
      supabase.from("document_types").select("doc_key, label").order("sort_order"),
      supabase
        .from("student_documents")
        .select("id, student_id, label, doc_key, status, requested_at")
        .order("requested_at", { ascending: false }),
      supabase
        .from("student_document_submissions")
        .select("id, student_document_id, path, original_name, uploaded_by, uploaded_at, status, reviewed_at, review_note")
        .order("uploaded_at", { ascending: false }),
    ]);

  const documents = (docs ?? []) as StudentDocument[];
  const submissions = (subs ?? []) as DocSubmission[];

  // Noms + relation des déposants.
  const studentIds = [...new Set(documents.map((d) => d.student_id))];
  const uploaderIds = [...new Set(submissions.map((s) => s.uploaded_by).filter(Boolean))] as string[];
  const relMap = new Map<string, string | null>(); // `${student}:${parent}` -> relationship
  const nameMap = new Map<string, string>();
  for (const s of students ?? []) nameMap.set(s.id, s.full_name || s.email);
  if (studentIds.length > 0) {
    const { data: links } = await supabase
      .from("parent_links")
      .select("parent_id, student_id, relationship")
      .in("student_id", studentIds);
    for (const l of links ?? []) relMap.set(`${l.student_id}:${l.parent_id}`, l.relationship);
  }
  const missingNames = [...new Set([...studentIds, ...uploaderIds])].filter((id) => !nameMap.has(id));
  if (missingNames.length > 0) {
    const { data: people } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", missingNames);
    for (const p of people ?? []) nameMap.set(p.id, p.full_name || p.email);
  }

  const uploaderLabel = (studentId: string, uploadedBy: string | null): string => {
    if (!uploadedBy) return "—";
    const name = nameMap.get(uploadedBy) ?? "Utilisateur";
    if (uploadedBy === studentId) return `Étudiant · ${name}`;
    const rel = relMap.get(`${studentId}:${uploadedBy}`);
    return `${rel ? PARENT_RELATIONSHIP_LABEL[rel] ?? "Parent" : "Parent"} · ${name}`;
  };

  // Soumissions groupées par document.
  const subsByDoc = new Map<string, DocSubmission[]>();
  for (const s of submissions) {
    const arr = subsByDoc.get(s.student_document_id) ?? [];
    arr.push(s);
    subsByDoc.set(s.student_document_id, arr);
  }

  // Documents groupés par étudiant.
  const docsByStudent = new Map<string, StudentDocument[]>();
  for (const d of documents) {
    const arr = docsByStudent.get(d.student_id) ?? [];
    arr.push(d);
    docsByStudent.set(d.student_id, arr);
  }

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/espace"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Documents à fournir
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Demandez des pièces, suivez les dépôts et validez — l&apos;historique est conservé.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[22rem_1fr]">
            <div className="order-1">
              <RequiredDocForm students={students ?? []} docTypes={docTypes ?? []} />
            </div>

            <div className="order-2 space-y-6">
              {docsByStudent.size === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucune pièce demandée pour le moment.
                </p>
              ) : (
                [...docsByStudent.entries()].map(([sid, list]) => (
                  <div key={sid}>
                    <h2 className="mb-2 font-bold text-ipmd-black">{nameMap.get(sid) ?? "—"}</h2>
                    <ul className="space-y-3">
                      {list.map((d) => {
                        const st = DOC_STATUS[d.status] ?? DOC_STATUS.a_fournir;
                        const dsubs = subsByDoc.get(d.id) ?? [];
                        const latest = dsubs[0];
                        return (
                          <li key={d.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-semibold text-ipmd-black">{d.label}</p>
                              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${st.cls}`}>
                                {st.label}
                              </span>
                            </div>
                            {dsubs.length === 0 ? (
                              <p className="mt-1 text-xs text-black/45">Aucun dépôt pour l&apos;instant.</p>
                            ) : (
                              <ul className="mt-2 space-y-2">
                                {dsubs.map((s) => {
                                  const ss = DOC_STATUS[s.status] ?? DOC_STATUS.fourni;
                                  return (
                                    <li key={s.id} className="rounded-xl bg-ipmd-light px-3 py-2">
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="text-xs text-black/60">
                                          {uploaderLabel(d.student_id, s.uploaded_by)} · {frDate(s.uploaded_at)}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ss.cls}`}>
                                            {ss.label}
                                          </span>
                                          <DocDownloadButton path={s.path} />
                                        </div>
                                      </div>
                                      {s.review_note && (
                                        <p className="mt-1 text-[11px] text-ipmd-red">Motif : {s.review_note}</p>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                            {latest && latest.status === "fourni" && (
                              <DocReview submissionId={latest.id} />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
