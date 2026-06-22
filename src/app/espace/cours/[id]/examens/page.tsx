import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/require-teacher";
import { Container } from "@/components/ui/Container";
import { NewExamForm } from "@/components/espace/NewExamForm";
import { deleteExam } from "@/lib/exam-actions";

export const metadata: Metadata = {
  title: "Examens du cours",
};

export default async function ExamensPage({
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

  const { data: rows } = await supabase
    .from("exams")
    .select("id, title, published, created_at")
    .eq("course_id", id)
    .order("created_at", { ascending: false });
  const exams = rows ?? [];

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
            Examens en ligne — {course.title}
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Créez des QCM auto-corrigés. La note se reporte automatiquement.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
            <div className="order-2 lg:order-1">
              {exams.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucun examen. Créez-en un →
                </p>
              ) : (
                <ul className="space-y-3">
                  {exams.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                    >
                      <Link
                        href={`/espace/cours/${id}/examens/${e.id}`}
                        className="min-w-0 flex-1"
                      >
                        <p className="truncate font-semibold text-ipmd-black">
                          {e.title}
                        </p>
                        <span
                          className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            e.published
                              ? "bg-green-600/10 text-green-700"
                              : "bg-ipmd-light text-black/45"
                          }`}
                        >
                          {e.published ? "Publié" : "Brouillon"}
                        </span>
                      </Link>
                      <form action={deleteExam.bind(null, id, e.id)}>
                        <button
                          type="submit"
                          className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-ipmd-red hover:bg-ipmd-red/10"
                        >
                          ✕
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="order-1 lg:order-2">
              <NewExamForm courseId={id} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
