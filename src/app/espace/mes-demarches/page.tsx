import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { ConvocationAck } from "@/components/espace/ConvocationAck";
import { DocumentUpload } from "@/components/espace/DocumentUpload";
import { DocDownloadButton } from "@/components/espace/DocDownloadButton";
import {
  CONVOCATION_STATUS,
  convocationWhen,
  type Convocation,
} from "@/lib/convocations";
import {
  DOC_STATUS,
  type StudentDocument,
  type DocSubmission,
} from "@/lib/student-documents";

export const metadata: Metadata = { title: "Mes démarches" };

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function MesDemarchesPage() {
  const { supabase, userId } = await requireUser();

  // Convocations de l'étudiant + ses propres accusés.
  const { data: convocRows } = await supabase
    .from("convocations")
    .select("id, student_id, title, reason, scheduled_at, location, status, created_at, acknowledged_at")
    .eq("student_id", userId)
    .neq("status", "annulee")
    .order("created_at", { ascending: false });
  const convocations = (convocRows ?? []) as Convocation[];
  let myAcks = new Set<string>();
  if (convocations.length > 0) {
    const { data: acks } = await supabase
      .from("convocation_acknowledgements")
      .select("convocation_id")
      .eq("user_id", userId)
      .in("convocation_id", convocations.map((c) => c.id));
    myAcks = new Set((acks ?? []).map((a) => a.convocation_id));
  }

  // Documents à fournir de l'étudiant + historique des dépôts.
  const { data: docRows } = await supabase
    .from("student_documents")
    .select("id, student_id, label, doc_key, status, requested_at")
    .eq("student_id", userId)
    .order("requested_at", { ascending: false });
  const studentDocs = (docRows ?? []) as StudentDocument[];
  const subsByDoc = new Map<string, DocSubmission[]>();
  if (studentDocs.length > 0) {
    const { data: subRows } = await supabase
      .from("student_document_submissions")
      .select("id, student_document_id, path, original_name, uploaded_by, uploaded_at, status, reviewed_at, review_note")
      .in("student_document_id", studentDocs.map((d) => d.id))
      .order("uploaded_at", { ascending: false });
    for (const s of (subRows ?? []) as DocSubmission[]) {
      const arr = subsByDoc.get(s.student_document_id) ?? [];
      arr.push(s);
      subsByDoc.set(s.student_document_id, arr);
    }
  }

  const nothing = convocations.length === 0 && studentDocs.length === 0;

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/espace"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Mes démarches
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Vos convocations et les pièces que l&apos;IPMD vous demande.
          </p>

          {nothing && (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucune convocation ni pièce demandée pour l&apos;instant.
            </p>
          )}

          {/* Convocations */}
          {convocations.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-ipmd-black">📨 Mes convocations</h2>
              <ul className="mt-3 space-y-3">
                {convocations.map((c) => {
                  const st = CONVOCATION_STATUS[c.status] ?? CONVOCATION_STATUS.envoyee;
                  const when = convocationWhen(c.scheduled_at);
                  return (
                    <li key={c.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ipmd-red/20">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-bold text-ipmd-black">{c.title}</p>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${st.cls}`}>
                          {st.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-black/55">
                        {when ? `🗓️ ${when}` : ""}
                        {c.location ? `${when ? " · " : ""}📍 ${c.location}` : ""}
                      </p>
                      {c.reason && (
                        <p className="mt-2 whitespace-pre-line text-sm text-black/70">{c.reason}</p>
                      )}
                      <div className="mt-3">
                        <ConvocationAck convocationId={c.id} acked={myAcks.has(c.id)} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Documents à fournir */}
          {studentDocs.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-ipmd-black">📎 Mes documents à fournir</h2>
              <ul className="mt-3 space-y-3">
                {studentDocs.map((d) => {
                  const st = DOC_STATUS[d.status] ?? DOC_STATUS.a_fournir;
                  const dsubs = subsByDoc.get(d.id) ?? [];
                  const latest = dsubs[0];
                  return (
                    <li key={d.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold text-ipmd-black">{d.label}</p>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${st.cls}`}>
                          {st.label}
                        </span>
                      </div>
                      {latest?.status === "refuse" && latest.review_note && (
                        <p className="mt-1 text-xs text-ipmd-red">
                          Motif du refus : {latest.review_note}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <DocumentUpload studentId={userId} studentDocumentId={d.id} label={d.label} />
                        {latest && <DocDownloadButton path={latest.path} label="Dernier dépôt" />}
                      </div>
                      {dsubs.length > 0 && (
                        <ul className="mt-2 space-y-0.5 border-t border-black/5 pt-2">
                          {dsubs.map((s) => {
                            const ss = DOC_STATUS[s.status] ?? DOC_STATUS.fourni;
                            return (
                              <li key={s.id} className="text-[11px] text-black/45">
                                {fmtDate(s.uploaded_at)} · {ss.label}
                                {s.status === "refuse" && s.review_note ? ` — ${s.review_note}` : ""}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
