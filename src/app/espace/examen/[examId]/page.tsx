import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { ExamTaker } from "@/components/espace/ExamTaker";

export const metadata: Metadata = {
  title: "Examen en ligne",
};

export default async function ExamenPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const { supabase, userId } = await requireUser();

  // RLS : l'étudiant ne lit l'examen que s'il est publié et qu'il est inscrit.
  const { data: exam } = await supabase
    .from("exams")
    .select("id, title, course_id")
    .eq("id", examId)
    .single();
  if (!exam) notFound();

  // Déjà passé ?
  const { data: existing } = await supabase
    .from("exam_submissions")
    .select("score, max_score")
    .eq("exam_id", examId)
    .eq("student_id", userId)
    .maybeSingle();

  // Questions (sans les bonnes réponses) via RPC sécurisée.
  const { data: questions } = existing
    ? { data: [] }
    : await supabase.rpc("get_exam_questions", { p_exam_id: examId });

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
            {exam.title}
          </h1>

          {existing ? (
            <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
              <p className="text-3xl">✅</p>
              <p className="mt-3 font-semibold text-ipmd-black">
                Tu as déjà passé cet examen.
              </p>
              <p className="mt-2 text-lg">
                Ta note :{" "}
                <span className="font-extrabold text-ipmd-red">
                  {Number(existing.score)}/{Number(existing.max_score)}
                </span>
              </p>
            </div>
          ) : !questions || questions.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Cet examen n&apos;a pas encore de questions.
            </p>
          ) : (
            <div className="mt-8">
              <p className="mb-5 text-sm text-black/55">
                Réponds à toutes les questions, puis soumets. La correction est
                immédiate.
              </p>
              <ExamTaker examId={examId} questions={questions} />
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
