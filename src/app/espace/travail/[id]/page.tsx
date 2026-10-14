import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAcademic } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { WorkActions } from "@/components/espace/works/WorkActions";
import type { Opt } from "@/components/espace/works/AcademicWorkCreateForm";
import { WORK_TYPE_LABEL, WORK_STATUS, type WorkStatus } from "@/lib/academic-works";

export const metadata: Metadata = { title: "Travail" };

function fmt(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

const SUB_STATUS: Record<string, { label: string; cls: string }> = {
  fourni: { label: "Déposé", cls: "bg-sky-50 text-sky-700" },
  valide: { label: "Validé", cls: "bg-emerald-50 text-emerald-700" },
  refuse: { label: "Refusé", cls: "bg-rose-50 text-rose-700" },
};

type Work = {
  id: string;
  student_name: string | null;
  academic_year: string | null;
  work_type: string;
  title: string | null;
  internship_id: string | null;
  academic_advisor_id: string | null;
  academic_advisor_name: string | null;
  student_document_id: string | null;
  status: string;
  internships: { title: string | null; student_name: string | null } | null;
};

type Submission = {
  id: string;
  original_name: string | null;
  uploaded_at: string | null;
  status: string;
  review_note: string | null;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-black/40">{label}</dt>
      <dd className="mt-0.5 text-sm text-ipmd-black">{children}</dd>
    </div>
  );
}

export default async function TravailDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAcademic();

  const { data } = await supabase
    .from("academic_works")
    .select(
      "id, student_name, academic_year, work_type, title, internship_id, academic_advisor_id, academic_advisor_name, student_document_id, status, internships(title, student_name)"
    )
    .eq("id", id)
    .single();
  const work = data as unknown as Work | null;
  if (!work) notFound();

  // Historique du dépôt (RLS DÉ) + encadreurs éligibles (liste DÉ-safe D7-1).
  const [subsRes, teachersRes] = await Promise.all([
    work.student_document_id
      ? supabase
          .from("student_document_submissions")
          .select("id, original_name, uploaded_at, status, review_note")
          .eq("student_document_id", work.student_document_id)
          .order("uploaded_at", { ascending: false })
      : Promise.resolve({ data: [] as Submission[] }),
    supabase.rpc("pedagogical_teachers"),
  ]);
  const submissions = (subsRes.data ?? []) as Submission[];
  const advisorOpts: Opt[] = (
    (teachersRes.data ?? []) as { profile_id: string; full_name: string | null }[]
  ).map((t) => ({ value: t.profile_id, label: t.full_name ?? "(sans nom)" }));

  const badge = WORK_STATUS[work.status as WorkStatus];

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link href="/espace/travaux" className="text-sm text-black/50 hover:text-ipmd-black">
            ← Tous les travaux
          </Link>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">
                {work.student_name ?? "—"}
              </h1>
              <p className="mt-0.5 text-sm text-black/60">{work.title ?? "—"}</p>
            </div>
            <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${badge?.cls ?? ""}`}>
              {badge?.label ?? work.status}
            </span>
          </div>

          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Type">{WORK_TYPE_LABEL[work.work_type] ?? work.work_type}</Field>
              <Field label="Statut">{badge?.label ?? work.status}</Field>
              <Field label="Année académique">{work.academic_year ?? "—"}</Field>
              <Field label="Encadreur académique">{work.academic_advisor_name ?? "— Non affecté —"}</Field>
              <Field label="Stage associé">
                {work.internship_id ? (
                  <Link href={`/espace/stage/${work.internship_id}`} className="text-sky-700 underline">
                    {work.internships?.title ?? "Stage"}
                  </Link>
                ) : (
                  "— Aucun —"
                )}
              </Field>
            </dl>
          </div>

          {/* Historique du dépôt */}
          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="text-base font-bold text-ipmd-black">Dépôt de l&apos;étudiant</h2>
            {!work.student_document_id ? (
              <p className="mt-2 text-sm text-black/55">
                Le dépôt n&apos;est pas encore ouvert. Utilisez « Ouvrir le dépôt » pour créer la
                demande documentaire de l&apos;étudiant.
              </p>
            ) : submissions.length === 0 ? (
              <p className="mt-2 text-sm text-black/55">Dépôt ouvert — aucune version déposée pour l&apos;instant.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {submissions.map((s) => {
                  const st = SUB_STATUS[s.status] ?? { label: s.status, cls: "bg-black/5 text-black/60" };
                  return (
                    <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/10 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ipmd-black">{s.original_name ?? "fichier"}</p>
                        <p className="text-xs text-black/45">{fmt(s.uploaded_at)}</p>
                        {s.review_note && <p className="mt-0.5 text-xs text-ipmd-red">Motif : {s.review_note}</p>}
                      </div>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>
                        {st.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="text-base font-bold text-ipmd-black">Actions</h2>
            <p className="mt-0.5 mb-3 text-xs text-black/50">
              Chaque action est gardée par la base (statut, éligibilité, synchronisation du document).
            </p>
            <WorkActions
              id={work.id}
              status={work.status}
              advisorId={work.academic_advisor_id}
              advisors={advisorOpts}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
