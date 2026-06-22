import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
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

export default async function MesCoursDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, userId } = await requireUser();

  // La RLS ne renvoie le cours que si l'étudiant y est inscrit.
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, field, description")
    .eq("id", id)
    .single();

  if (!course) notFound();

  const { data: aRows } = await supabase
    .from("assignments")
    .select("id, title, description, due_date")
    .eq("course_id", id)
    .order("created_at", { ascending: false });
  const assignments = aRows ?? [];

  const { data: sRows } = await supabase
    .from("schedule_sessions")
    .select("id, day_of_week, start_time, end_time, room")
    .eq("course_id", id)
    .order("day_of_week")
    .order("start_time");
  const sessions = sRows ?? [];

  const { data: gRows } = await supabase
    .from("grades")
    .select("id, title, score, max_score, comment")
    .eq("course_id", id)
    .order("created_at", { ascending: false });
  const grades = gRows ?? [];

  const { data: lessonRows } = await supabase
    .from("course_lessons")
    .select("id, lesson_date, theme")
    .eq("course_id", id)
    .order("lesson_date", { ascending: false });
  const lessons = lessonRows ?? [];

  const { data: attRows } = await supabase
    .from("attendance")
    .select("lesson_id, present")
    .eq("student_id", userId);
  const attMap = new Map((attRows ?? []).map((a) => [a.lesson_id, a.present]));
  const presentCount = lessons.filter((l) => attMap.get(l.id) === true).length;
  const absentCount = lessons.filter((l) => attMap.get(l.id) === false).length;

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/espace/mes-cours"
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

          {/* Séances */}
          <h2 className="mt-8 text-lg font-bold text-ipmd-black">Séances</h2>
          {sessions.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucune séance planifiée.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
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

          {/* Mes notes pour ce cours */}
          <h2 className="mt-8 text-lg font-bold text-ipmd-black">Mes notes</h2>
          {grades.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucune note pour l&apos;instant.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              {grades.map((g) => (
                <li
                  key={g.id}
                  className="flex items-start justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ipmd-black">{g.title}</p>
                    {g.comment && (
                      <p className="mt-0.5 text-xs italic text-black/45">
                        {g.comment}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-lg bg-ipmd-light px-2.5 py-1 text-sm font-bold text-ipmd-black">
                    {Number(g.score)}/{Number(g.max_score)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Ma présence */}
          <h2 className="mt-8 text-lg font-bold text-ipmd-black">Ma présence</h2>
          {lessons.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucune séance enregistrée pour l&apos;instant.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-black/55">
                <span className="font-bold text-green-600">{presentCount}</span>{" "}
                présence(s) ·{" "}
                <span className="font-bold text-ipmd-red">{absentCount}</span>{" "}
                absence(s)
              </p>
              <ul className="mt-3 divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                {lessons.map((l) => {
                  const st = attMap.get(l.id);
                  return (
                    <li
                      key={l.id}
                      className="flex items-center justify-between gap-3 p-4"
                    >
                      <div className="min-w-0">
                        <p className="font-medium capitalize text-ipmd-black">
                          {formatDate(l.lesson_date)}
                        </p>
                        {l.theme && (
                          <p className="truncate text-xs text-black/50">
                            {l.theme}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                          st === undefined
                            ? "bg-ipmd-light text-black/40"
                            : st
                              ? "bg-green-600/10 text-green-700"
                              : "bg-ipmd-red/10 text-ipmd-red"
                        }`}
                      >
                        {st === undefined ? "—" : st ? "Présent" : "Absent"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {/* Devoirs */}
          <h2 className="mt-8 text-lg font-bold text-ipmd-black">Devoirs</h2>
          {assignments.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucun devoir pour l&apos;instant.
            </p>
          ) : (
            <ul className="mt-3 space-y-4">
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
      </Container>
    </section>
  );
}
