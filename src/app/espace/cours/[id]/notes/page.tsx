import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/require-teacher";
import { Container } from "@/components/ui/Container";
import { AddGradeForm } from "@/components/espace/AddGradeForm";
import { removeGrade } from "@/lib/teaching-actions";

export const metadata: Metadata = {
  title: "Notes du cours",
};

export default async function CourseNotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, userId } = await requireTeacher();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, teacher_id")
    .eq("id", id)
    .single();
  if (!course || course.teacher_id !== userId) notFound();

  // Étudiants inscrits.
  const { data: enr } = await supabase
    .from("enrollments")
    .select("student_id")
    .eq("course_id", id);
  const studentIds = (enr ?? []).map((e) => e.student_id);

  const studentMap = new Map<
    string,
    { id: string; full_name: string | null; email: string }
  >();
  if (studentIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", studentIds);
    for (const p of profs ?? []) studentMap.set(p.id, p);
  }
  const students = [...studentMap.values()];

  // Notes du cours.
  const { data: gradeRows } = await supabase
    .from("grades")
    .select("id, student_id, title, score, max_score, type, coefficient, comment, created_at")
    .eq("course_id", id)
    .order("created_at", { ascending: false });
  const grades = gradeRows ?? [];
  const nbClasse = grades.filter((g) => g.type !== "examen").length;
  const nbExamen = grades.filter((g) => g.type === "examen").length;

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <Link
            href={`/espace/cours/${id}`}
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Retour au cours
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Notes — {course.title}
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Saisissez les notes de vos étudiants. Rappel IPMD : au moins{" "}
            <strong>2 notes de classe</strong> + <strong>1 examen</strong> par
            étudiant ({nbClasse} de classe · {nbExamen} examen saisies).
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
            {/* Liste des notes */}
            <div className="order-2 lg:order-1">
              <div className="mb-4 flex items-baseline gap-3">
                <h2 className="text-lg font-bold text-ipmd-black">
                  Notes saisies
                </h2>
                <span className="rounded-full bg-ipmd-red px-2.5 py-1 text-xs font-bold text-white">
                  {grades.length}
                </span>
              </div>

              {grades.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucune note saisie. Ajoutez-en une →
                </p>
              ) : (
                <ul className="space-y-3">
                  {grades.map((g) => {
                    const student = studentMap.get(g.student_id);
                    return (
                      <li
                        key={g.id}
                        className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ipmd-black">
                              {student?.full_name || student?.email || "—"}
                            </p>
                            <p className="text-sm text-black/55">
                              {g.title}
                              <span
                                className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  g.type === "examen"
                                    ? "bg-ipmd-red/10 text-ipmd-red"
                                    : "bg-ipmd-light text-black/50"
                                }`}
                              >
                                {g.type === "examen" ? "Examen" : "Classe"}
                                {Number(g.coefficient) !== 1 &&
                                  ` ·×${Number(g.coefficient)}`}
                              </span>
                            </p>
                            {g.comment && (
                              <p className="mt-1 text-xs italic text-black/45">
                                {g.comment}
                              </p>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="rounded-lg bg-ipmd-light px-2.5 py-1 text-sm font-bold text-ipmd-black">
                              {Number(g.score)}/{Number(g.max_score)}
                            </span>
                            <form
                              action={removeGrade.bind(null, id, g.id)}
                            >
                              <button
                                type="submit"
                                className="rounded-lg px-2 py-1 text-xs font-semibold text-ipmd-red transition-colors hover:bg-ipmd-red/10"
                              >
                                Suppr.
                              </button>
                            </form>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Formulaire */}
            <div className="order-1 lg:order-2">
              <AddGradeForm courseId={id} students={students} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
