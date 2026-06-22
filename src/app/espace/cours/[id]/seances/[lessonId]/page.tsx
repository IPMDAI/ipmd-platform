import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/require-teacher";
import { Container } from "@/components/ui/Container";
import { AttendanceSheet } from "@/components/espace/AttendanceSheet";

export const metadata: Metadata = {
  title: "Appel & fiche",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = await params;
  const { supabase, userId } = await requireTeacher();

  const { data: lesson } = await supabase
    .from("course_lessons")
    .select("id, course_id, lesson_date, theme, resources, hours")
    .eq("id", lessonId)
    .single();
  if (!lesson || lesson.course_id !== id) notFound();

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

  const profiles = new Map<
    string,
    { id: string; full_name: string | null; email: string }
  >();
  if (studentIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", studentIds);
    for (const p of profs ?? []) profiles.set(p.id, p);
  }

  // Présences déjà enregistrées.
  const { data: att } = await supabase
    .from("attendance")
    .select("student_id, present")
    .eq("lesson_id", lessonId);
  const presentMap = new Map((att ?? []).map((a) => [a.student_id, a.present]));

  const students = [...profiles.values()].map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    present: presentMap.has(p.id) ? (presentMap.get(p.id) as boolean) : true,
  }));

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link
            href={`/espace/cours/${id}/seances`}
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Toutes les séances
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold capitalize tracking-tight text-ipmd-black">
            {formatDate(lesson.lesson_date)}
          </h1>
          <p className="mt-1 text-sm text-black/55">
            {course.title}
            {lesson.theme && ` · ${lesson.theme}`}
            {lesson.hours != null && ` · ${Number(lesson.hours)} h`}
          </p>

          {/* Fiche pédagogique */}
          {lesson.resources && (
            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-black/50">
                Fiche pédagogique
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-black/70">
                {lesson.resources}
              </p>
            </div>
          )}

          {/* Appel */}
          <h2 className="mt-8 text-lg font-bold text-ipmd-black">Appel</h2>
          <div className="mt-3">
            <AttendanceSheet lessonId={lessonId} students={students} />
          </div>
        </div>
      </Container>
    </section>
  );
}
