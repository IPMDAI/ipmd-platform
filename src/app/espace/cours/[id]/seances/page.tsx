import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/require-teacher";
import { Container } from "@/components/ui/Container";
import { NewLessonForm } from "@/components/espace/NewLessonForm";
import { deleteLesson } from "@/lib/attendance-actions";

export const metadata: Metadata = {
  title: "Séances du cours",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function SeancesPage({
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
    .from("course_lessons")
    .select("id, lesson_date, theme, hours")
    .eq("course_id", id)
    .order("lesson_date", { ascending: false });
  const lessons = rows ?? [];

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
            Séances — {course.title}
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Remplissez la fiche de chaque séance et faites l&apos;appel.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
            {/* Liste des séances */}
            <div className="order-2 lg:order-1">
              <div className="mb-4 flex items-baseline gap-3">
                <h2 className="text-lg font-bold text-ipmd-black">
                  Séances réalisées
                </h2>
                <span className="rounded-full bg-ipmd-red px-2.5 py-1 text-xs font-bold text-white">
                  {lessons.length}
                </span>
              </div>

              {lessons.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucune séance enregistrée. Créez-en une →
                </p>
              ) : (
                <ul className="space-y-3">
                  {lessons.map((l) => (
                    <li
                      key={l.id}
                      className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold capitalize text-ipmd-black">
                            {formatDate(l.lesson_date)}
                          </p>
                          <p className="text-sm text-black/55">
                            {l.theme || "Séance"}
                            {l.hours != null && ` · ${Number(l.hours)} h`}
                          </p>
                        </div>
                        <form action={deleteLesson.bind(null, id, l.id)}>
                          <button
                            type="submit"
                            className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-ipmd-red hover:bg-ipmd-red/10"
                          >
                            ✕
                          </button>
                        </form>
                      </div>
                      <Link
                        href={`/espace/cours/${id}/seances/${l.id}`}
                        className="mt-2 inline-block text-xs font-semibold text-ipmd-red"
                      >
                        Faire l&apos;appel / voir la fiche →
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Formulaire */}
            <div className="order-1 lg:order-2">
              <NewLessonForm courseId={id} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
