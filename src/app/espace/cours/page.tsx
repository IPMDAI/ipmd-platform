import type { Metadata } from "next";
import Link from "next/link";
import { requireTeacher } from "@/lib/require-teacher";
import { Container } from "@/components/ui/Container";
import { NewCourseForm } from "@/components/espace/NewCourseForm";

export const metadata: Metadata = {
  title: "Mes cours",
};

function frDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

export default async function CoursPage() {
  const { supabase, userId } = await requireTeacher();

  const { data: rows } = await supabase
    .from("courses")
    .select("id, title, field, description, created_at")
    .eq("teacher_id", userId)
    .order("created_at", { ascending: false });
  const courses = rows ?? [];
  const ids = courses.map((c) => c.id);

  const students = new Map<string, number>();
  const lessonsCount = new Map<string, number>();
  const nextLesson = new Map<string, string>();
  const devoirs = new Map<string, number>();

  if (ids.length > 0) {
    const today = new Date().toISOString().slice(0, 10);
    const [{ data: enr }, { data: lessons }, { data: assigns }] =
      await Promise.all([
        supabase.from("enrollments").select("course_id").in("course_id", ids),
        supabase
          .from("course_lessons")
          .select("course_id, lesson_date")
          .in("course_id", ids),
        supabase.from("assignments").select("course_id").in("course_id", ids),
      ]);

    for (const e of enr ?? [])
      students.set(e.course_id, (students.get(e.course_id) ?? 0) + 1);
    for (const a of assigns ?? [])
      devoirs.set(a.course_id, (devoirs.get(a.course_id) ?? 0) + 1);
    for (const l of lessons ?? []) {
      lessonsCount.set(l.course_id, (lessonsCount.get(l.course_id) ?? 0) + 1);
      if (l.lesson_date >= today) {
        const cur = nextLesson.get(l.course_id);
        if (!cur || l.lesson_date < cur)
          nextLesson.set(l.course_id, l.lesson_date);
      }
    }
  }

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/espace"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Mes cours
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Créez vos cours, puis ouvrez-en un pour les séances, devoirs, notes
            et présences.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
            <div className="order-2 lg:order-1">
              {courses.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucun cours pour le moment. Créez votre premier cours →
                </p>
              ) : (
                <ul className="space-y-4">
                  {courses.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/espace/cours/${c.id}`}
                        className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-ipmd-red/30"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-base font-bold text-ipmd-black">
                            {c.title}
                          </h3>
                          {c.field && (
                            <span className="shrink-0 rounded-full bg-ipmd-red/10 px-2.5 py-1 text-[11px] font-semibold text-ipmd-red">
                              {c.field}
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                          <span className="rounded-full bg-ipmd-light px-2.5 py-1 text-black/60">
                            👥 {students.get(c.id) ?? 0} étudiant(s)
                          </span>
                          <span className="rounded-full bg-ipmd-light px-2.5 py-1 text-black/60">
                            🗓️ {lessonsCount.get(c.id) ?? 0} séance(s)
                          </span>
                          <span className="rounded-full bg-ipmd-light px-2.5 py-1 text-black/60">
                            📝 {devoirs.get(c.id) ?? 0} devoir(s)
                          </span>
                        </div>

                        {nextLesson.get(c.id) && (
                          <p className="mt-3 text-xs font-medium text-ipmd-black">
                            ⏭️ Prochaine séance : {frDate(nextLesson.get(c.id)!)}
                          </p>
                        )}

                        <span className="mt-3 inline-block text-xs font-semibold text-ipmd-red">
                          Gérer le cours →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="order-1 lg:order-2">
              <NewCourseForm />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
