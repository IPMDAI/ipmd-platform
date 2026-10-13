import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { GradeCorrectionForm } from "@/components/espace/GradeCorrectionForm";

export const metadata: Metadata = { title: "Correction de notes" };

const inputCls =
  "rounded-lg border border-black/15 bg-white px-3 py-2 text-sm focus:border-ipmd-red focus:outline-none";

/**
 * Correction exceptionnelle de notes — RÉSERVÉ au Directeur des Études (Cas B).
 * Toute correction est atomique (RPC) + tracée (audit) avec motif obligatoire.
 */
export default async function CorrectionNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const { supabase, userId } = await requireUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (me?.role !== "directeur_etudes") redirect("/espace");

  const sp = await searchParams;
  const studentId = sp.student;

  // Liste des étudiants (sélection).
  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "etudiant")
    .order("full_name");

  // Notes de l'étudiant sélectionné + cours + enseignant propriétaire.
  type Row = {
    id: string;
    title: string;
    score: number;
    max_score: number;
    type: string | null;
    semester: string | null;
    course_title: string;
    teacher_name: string;
  };
  let rows: Row[] = [];
  let studentName = "";
  if (studentId) {
    const sel = (students ?? []).find((s) => s.id === studentId);
    studentName = sel?.full_name || sel?.email || "—";
    const { data: grades } = await supabase
      .from("grades")
      .select("id, title, score, max_score, type, semester, course_id")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });
    const courseIds = [...new Set((grades ?? []).map((g) => g.course_id))];
    const courseById = new Map<string, { title: string; teacher_id: string | null }>();
    const teacherName = new Map<string, string>();
    if (courseIds.length > 0) {
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title, teacher_id")
        .in("id", courseIds);
      for (const c of courses ?? [])
        courseById.set(c.id as string, {
          title: (c.title as string) ?? "—",
          teacher_id: (c.teacher_id as string) ?? null,
        });
      const tIds = [...new Set((courses ?? []).map((c) => c.teacher_id).filter(Boolean))];
      if (tIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", tIds as string[]);
        for (const p of profs ?? [])
          teacherName.set(p.id as string, (p.full_name as string) || (p.email as string));
      }
    }
    rows = (grades ?? []).map((g) => {
      const c = courseById.get(g.course_id as string);
      return {
        id: g.id as string,
        title: g.title as string,
        score: Number(g.score),
        max_score: Number(g.max_score),
        type: g.type as string | null,
        semester: g.semester as string | null,
        course_title: c?.title ?? "—",
        teacher_name: c?.teacher_id ? teacherName.get(c.teacher_id) ?? "—" : "—",
      };
    });
  }

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">
            Correction de notes
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Correction <strong>exceptionnelle</strong> d&apos;une note, y compris sur le
            cours d&apos;un autre enseignant. <strong>Motif obligatoire</strong> ; chaque
            correction est <strong>tracée dans le journal d&apos;audit</strong> (ancienne →
            nouvelle valeur, enseignant concerné).
          </p>

          <form className="mt-6 flex flex-wrap items-end gap-3">
            <label className="text-xs font-semibold text-black/60">
              Étudiant
              <select name="student" defaultValue={studentId ?? ""} className={`mt-0.5 block ${inputCls}`}>
                <option value="">— Choisir —</option>
                {(students ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name || s.email}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="rounded-lg bg-ipmd-black px-4 py-2 text-sm font-semibold text-white">
              Voir les notes
            </button>
          </form>

          {studentId && (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-ipmd-black">
                Notes de {studentName}
              </h2>
              {rows.length === 0 ? (
                <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucune note enregistrée pour cet étudiant.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {rows.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <span className="font-bold text-ipmd-black">{r.title}</span>
                          <span className="ml-2 text-sm text-black/55">
                            {r.course_title}
                            {r.type ? ` · ${r.type}` : ""}
                            {r.semester ? ` · ${r.semester}` : ""}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="font-extrabold text-ipmd-black">
                            {r.score}
                          </span>
                          <span className="text-black/45"> /{r.max_score}</span>
                          <span className="ml-2 text-xs text-black/45">
                            Enseignant : {r.teacher_name}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 border-t border-black/5 pt-3">
                        <GradeCorrectionForm
                          gradeId={r.id}
                          current={r.score}
                          max={r.max_score}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
