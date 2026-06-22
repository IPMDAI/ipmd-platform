import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { DAY_OPTIONS, formatTime } from "@/lib/schedule";
import { averageOn20 } from "@/lib/grades";

export const metadata: Metadata = {
  title: "Suivi",
};

type Grade = {
  id: string;
  course_id: string;
  title: string;
  score: number;
  max_score: number;
  comment: string | null;
};

export default async function EnfantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireUser();

  // La RLS ne renvoie l'enfant que si l'utilisateur en est le parent.
  const { data: child } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", id)
    .single();
  if (!child) notFound();

  // Cours de l'enfant.
  const { data: enr } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("student_id", id);
  const courseIds = (enr ?? []).map((e) => e.course_id);

  const courseTitle = new Map<string, string>();
  let courses: { id: string; title: string; field: string | null }[] = [];
  if (courseIds.length > 0) {
    const { data } = await supabase
      .from("courses")
      .select("id, title, field")
      .in("id", courseIds)
      .order("title");
    courses = data ?? [];
    for (const c of courses) courseTitle.set(c.id, c.title);
  }

  // Notes de l'enfant.
  const { data: gradeRows } = await supabase
    .from("grades")
    .select("id, course_id, title, score, max_score, comment, created_at")
    .eq("student_id", id)
    .order("created_at", { ascending: false });
  const grades = (gradeRows ?? []) as Grade[];

  const byCourse = new Map<string, Grade[]>();
  for (const g of grades) {
    const arr = byCourse.get(g.course_id) ?? [];
    arr.push(g);
    byCourse.set(g.course_id, arr);
  }

  // Emploi du temps.
  let sessions: {
    id: string;
    course_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room: string | null;
  }[] = [];
  if (courseIds.length > 0) {
    const { data } = await supabase
      .from("schedule_sessions")
      .select("id, course_id, day_of_week, start_time, end_time, room")
      .in("course_id", courseIds)
      .order("start_time");
    sessions = data ?? [];
  }
  const byDay = new Map<number, typeof sessions>();
  for (const s of sessions) {
    const arr = byDay.get(s.day_of_week) ?? [];
    arr.push(s);
    byDay.set(s.day_of_week, arr);
  }

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/espace/mon-enfant"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Mes enfants
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            {child.full_name || child.email}
          </h1>

          {/* Notes */}
          <h2 className="mt-8 text-lg font-bold text-ipmd-black">Notes</h2>
          {grades.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucune note pour l&apos;instant.
            </p>
          ) : (
            <div className="mt-3 space-y-5">
              {[...byCourse.entries()].map(([cid, list]) => (
                <div
                  key={cid}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-3">
                    <h3 className="font-bold text-ipmd-black">
                      {courseTitle.get(cid) ?? "Cours"}
                    </h3>
                    <span className="rounded-full bg-ipmd-red/10 px-3 py-1 text-sm font-bold text-ipmd-red">
                      Moyenne {averageOn20(list)}
                    </span>
                  </div>
                  <ul className="divide-y divide-black/5">
                    {list.map((g) => (
                      <li
                        key={g.id}
                        className="flex items-start justify-between gap-3 px-5 py-3"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-ipmd-black">
                            {g.title}
                          </p>
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
                </div>
              ))}
            </div>
          )}

          {/* Emploi du temps */}
          <h2 className="mt-8 text-lg font-bold text-ipmd-black">
            Emploi du temps
          </h2>
          {sessions.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucune séance planifiée.
            </p>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {DAY_OPTIONS.map((day) => {
                const slots = byDay.get(day.value) ?? [];
                return (
                  <div
                    key={day.value}
                    className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                  >
                    <h3 className="border-b border-black/5 pb-2 text-sm font-bold uppercase tracking-wide text-ipmd-black">
                      {day.label}
                    </h3>
                    {slots.length === 0 ? (
                      <p className="mt-3 text-xs text-black/35">—</p>
                    ) : (
                      <ul className="mt-3 space-y-3">
                        {slots.map((s) => (
                          <li key={s.id} className="rounded-xl bg-ipmd-light p-3">
                            <p className="text-xs font-bold text-ipmd-red">
                              {formatTime(s.start_time)} – {formatTime(s.end_time)}
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-ipmd-black">
                              {courseTitle.get(s.course_id) ?? "Cours"}
                            </p>
                            {s.room && (
                              <p className="mt-0.5 text-xs text-black/50">
                                📍 {s.room}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Cours */}
          <h2 className="mt-8 text-lg font-bold text-ipmd-black">Cours suivis</h2>
          {courses.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucun cours pour l&apos;instant.
            </p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {courses.map((c) => (
                <li
                  key={c.id}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ipmd-black shadow-sm ring-1 ring-black/5"
                >
                  {c.title}
                  {c.field && (
                    <span className="ml-2 text-xs text-ipmd-red">{c.field}</span>
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
