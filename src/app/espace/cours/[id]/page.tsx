import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacher } from "@/lib/require-teacher";
import { Container } from "@/components/ui/Container";
import { NewAssignmentForm } from "@/components/espace/NewAssignmentForm";
import { NewSessionForm } from "@/components/espace/NewSessionForm";
import { EnrollStudentForm } from "@/components/espace/EnrollStudentForm";
import { EnrollClassForm } from "@/components/espace/EnrollClassForm";
import { CourseMetaForm } from "@/components/espace/CourseMetaForm";
import { removeEnrollment } from "@/lib/teaching-actions";
import { DAY_LABELS, formatTime } from "@/lib/schedule";

export const metadata: Metadata = {
  title: "Cours",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, userId } = await requireTeacher();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, field, description, teacher_id, ue_number, ue_name, ects")
    .eq("id", id)
    .single();

  // Cours inexistant ou n'appartenant pas à l'enseignant.
  if (!course || course.teacher_id !== userId) notFound();

  const { data: rows } = await supabase
    .from("assignments")
    .select("id, title, description, due_date, created_at")
    .eq("course_id", id)
    .order("created_at", { ascending: false });

  const assignments = rows ?? [];

  const { data: sessRows } = await supabase
    .from("schedule_sessions")
    .select("id, day_of_week, start_time, end_time, room")
    .eq("course_id", id)
    .order("day_of_week")
    .order("start_time");

  const sessions = sessRows ?? [];

  // Étudiants inscrits à ce cours.
  const { data: enrRows } = await supabase
    .from("enrollments")
    .select("id, student_id")
    .eq("course_id", id)
    .order("created_at");

  const enrollments = enrRows ?? [];
  const enrolledIds = enrollments.map((e) => e.student_id);

  let enrolledStudents: {
    enrollmentId: string;
    id: string;
    full_name: string | null;
    email: string;
  }[] = [];

  if (enrolledIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", enrolledIds);
    const map = new Map((profs ?? []).map((p) => [p.id, p]));
    enrolledStudents = enrollments.map((e) => {
      const p = map.get(e.student_id);
      return {
        enrollmentId: e.id,
        id: e.student_id,
        full_name: p?.full_name ?? null,
        email: p?.email ?? "",
      };
    });
  }

  // Étudiants disponibles (non encore inscrits).
  const { data: allStudents } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "etudiant")
    .order("full_name");

  const enrolledSet = new Set(enrolledIds);
  const availableStudents = (allStudents ?? []).filter(
    (s) => !enrolledSet.has(s.id)
  );

  const { data: classRows } = await supabase
    .from("classes")
    .select("id, name")
    .order("name");
  const classes = (classRows ?? []).map((c) => ({ id: c.id, name: c.name }));

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/espace/cours"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Tous mes cours
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">
              {course.title}
            </h1>
            {course.field && (
              <span className="rounded-full bg-ipmd-red/10 px-2.5 py-1 text-[11px] font-semibold text-ipmd-red">
                {course.field}
              </span>
            )}
          </div>
          {course.description && (
            <p className="mt-1 text-sm text-black/55">{course.description}</p>
          )}

          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-semibold text-ipmd-red">
              🎓 UE & ECTS (bulletin officiel)
              {course.ects ? ` — UE ${course.ue_number ?? "?"} · ${course.ects} ECTS` : ""}
            </summary>
            <CourseMetaForm
              courseId={course.id}
              ueNumber={course.ue_number ?? null}
              ueName={course.ue_name ?? null}
              ects={Number(course.ects ?? 0)}
            />
          </details>{" "}

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/espace/cours/${course.id}/notes`}
              className="inline-flex items-center gap-2 rounded-full bg-ipmd-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              🖊️ Saisir les notes
            </Link>
            <Link
              href="/espace/mes-seances"
              className="inline-flex items-center gap-2 rounded-full bg-ipmd-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              📋 Mes séances & appel
            </Link>
            <Link
              href={`/espace/cours/${course.id}/examens`}
              className="inline-flex items-center gap-2 rounded-full bg-ipmd-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              📝 Examens en ligne
            </Link>
          </div>

          {/* Étudiants inscrits */}
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
            <div className="order-2 lg:order-1">
              <div className="mb-4 flex items-baseline gap-3">
                <h2 className="text-lg font-bold text-ipmd-black">
                  Étudiants inscrits
                </h2>
                <span className="rounded-full bg-ipmd-black px-2.5 py-1 text-xs font-bold text-white">
                  {enrolledStudents.length}
                </span>
              </div>

              {enrolledStudents.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucun étudiant inscrit. Inscrivez-en un →
                </p>
              ) : (
                <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                  {enrolledStudents.map((s) => (
                    <li
                      key={s.enrollmentId}
                      className="flex items-center justify-between gap-3 p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ipmd-black">
                          {s.full_name || "—"}
                        </p>
                        <p className="truncate text-sm text-black/50">
                          {s.email}
                        </p>
                      </div>
                      <form
                        action={removeEnrollment.bind(
                          null,
                          course.id,
                          s.enrollmentId
                        )}
                      >
                        <button
                          type="submit"
                          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-ipmd-red transition-colors hover:bg-ipmd-red/10"
                        >
                          Retirer
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="order-1 space-y-4 lg:order-2">
              <EnrollStudentForm
                courseId={course.id}
                students={availableStudents}
              />
              <EnrollClassForm courseId={course.id} classes={classes} />
            </div>
          </div>

          {/* Séances (emploi du temps du cours) */}
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
            <div className="order-2 lg:order-1">
              <div className="mb-4 flex items-baseline gap-3">
                <h2 className="text-lg font-bold text-ipmd-black">Séances</h2>
                <span className="rounded-full bg-ipmd-black px-2.5 py-1 text-xs font-bold text-white">
                  {sessions.length}
                </span>
              </div>

              {sessions.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucune séance planifiée. Ajoutez un créneau →
                </p>
              ) : (
                <ul className="space-y-3">
                  {sessions.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                    >
                      <span className="rounded-full bg-ipmd-red/10 px-3 py-1 text-sm font-bold text-ipmd-red">
                        {DAY_LABELS[s.day_of_week] ?? "—"}
                      </span>
                      <span className="text-sm font-semibold text-ipmd-black">
                        {formatTime(s.start_time)} – {formatTime(s.end_time)}
                      </span>
                      {s.room && (
                        <span className="text-sm text-black/55">📍 {s.room}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="order-1 lg:order-2">
              <NewSessionForm courseId={course.id} />
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
            {/* Devoirs */}
            <div className="order-2 lg:order-1">
              <div className="mb-4 flex items-baseline gap-3">
                <h2 className="text-lg font-bold text-ipmd-black">Devoirs</h2>
                <span className="rounded-full bg-ipmd-red px-2.5 py-1 text-xs font-bold text-white">
                  {assignments.length}
                </span>
              </div>

              {assignments.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucun devoir pour ce cours. Ajoutez-en un →
                </p>
              ) : (
                <ul className="space-y-4">
                  {assignments.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-base font-bold text-ipmd-black">
                          {a.title}
                        </h3>
                        {a.due_date && (
                          <span className="shrink-0 rounded-full bg-ipmd-light px-2.5 py-1 text-[11px] font-semibold text-black/60">
                            À rendre le {formatDate(a.due_date)}
                          </span>
                        )}
                      </div>
                      {a.description && (
                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-black/60">
                          {a.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Formulaire d'ajout de devoir */}
            <div className="order-1 lg:order-2">
              <NewAssignmentForm courseId={course.id} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
