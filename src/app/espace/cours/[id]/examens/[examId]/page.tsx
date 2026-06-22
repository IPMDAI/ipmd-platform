import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/require-teacher";
import { Container } from "@/components/ui/Container";
import { NewQuestionForm } from "@/components/espace/NewQuestionForm";
import { GenerateQuestionsForm } from "@/components/espace/GenerateQuestionsForm";
import { toggleExamPublish, deleteQuestion } from "@/lib/exam-actions";

export const metadata: Metadata = {
  title: "Examen",
};

export default async function ExamBuilderPage({
  params,
}: {
  params: Promise<{ id: string; examId: string }>;
}) {
  const { id, examId } = await params;
  const { supabase, userId } = await requireTeacher();

  const { data: exam } = await supabase
    .from("exams")
    .select("id, title, published, course_id")
    .eq("id", examId)
    .single();
  if (!exam || exam.course_id !== id) notFound();

  const { data: course } = await supabase
    .from("courses")
    .select("id, teacher_id")
    .eq("id", id)
    .single();
  if (!course || course.teacher_id !== userId) notFound();

  const { data: qRows } = await supabase
    .from("exam_questions")
    .select("id, question, options, correct_index, points")
    .eq("exam_id", examId)
    .order("created_at");
  const questions = qRows ?? [];

  const { data: subRows } = await supabase
    .from("exam_submissions")
    .select("student_id, score, max_score")
    .eq("exam_id", examId);
  const submissions = subRows ?? [];

  const studentName = new Map<string, string>();
  if (submissions.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in(
        "id",
        submissions.map((s) => s.student_id)
      );
    for (const p of profs ?? [])
      studentName.set(p.id, p.full_name || p.email);
  }

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <Link
            href={`/espace/cours/${id}/examens`}
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Tous les examens
          </Link>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">
              {exam.title}
            </h1>
            <form action={toggleExamPublish.bind(null, id, examId, !exam.published)}>
              <button
                type="submit"
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 ${
                  exam.published
                    ? "bg-ipmd-light text-black/60"
                    : "bg-green-600 text-white"
                }`}
              >
                {exam.published ? "Dépublier" : "Publier l'examen"}
              </button>
            </form>
          </div>
          <p className="mt-1 text-sm text-black/55">
            {questions.length} question(s) ·{" "}
            {exam.published ? "Visible par les étudiants" : "Brouillon"}
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
            {/* Questions */}
            <div className="order-2 lg:order-1">
              <h2 className="mb-4 text-lg font-bold text-ipmd-black">
                Questions
              </h2>
              {questions.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucune question. Ajoutez-en une →
                </p>
              ) : (
                <ul className="space-y-3">
                  {questions.map((q, qi) => (
                    <li
                      key={q.id}
                      className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-ipmd-black">
                          {qi + 1}. {q.question}{" "}
                          <span className="text-xs font-normal text-black/40">
                            ({Number(q.points)} pt)
                          </span>
                        </p>
                        <form action={deleteQuestion.bind(null, id, examId, q.id)}>
                          <button
                            type="submit"
                            className="shrink-0 text-xs font-bold text-ipmd-red hover:underline"
                          >
                            ✕
                          </button>
                        </form>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {(q.options as string[]).map((opt, oi) => (
                          <li
                            key={oi}
                            className={`text-sm ${
                              oi === q.correct_index
                                ? "font-semibold text-green-700"
                                : "text-black/60"
                            }`}
                          >
                            {oi === q.correct_index ? "✓ " : "• "}
                            {opt}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}

              {/* Résultats */}
              {submissions.length > 0 && (
                <>
                  <h2 className="mb-3 mt-8 text-lg font-bold text-ipmd-black">
                    Résultats
                  </h2>
                  <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                    {submissions.map((s) => (
                      <li
                        key={s.student_id}
                        className="flex items-center justify-between gap-3 p-4 text-sm"
                      >
                        <span className="font-semibold text-ipmd-black">
                          {studentName.get(s.student_id) ?? "—"}
                        </span>
                        <span className="rounded-lg bg-ipmd-light px-2.5 py-1 font-bold text-ipmd-black">
                          {Number(s.score)}/{Number(s.max_score)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* Génération IA + ajout manuel */}
            <div className="order-1 space-y-6 lg:order-2">
              <GenerateQuestionsForm courseId={id} examId={examId} />
              <NewQuestionForm courseId={id} examId={examId} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
