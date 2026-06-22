import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatTime } from "@/lib/schedule";

function todayDow(): number {
  const js = new Date().getDay();
  return js === 0 ? 7 : js;
}

/**
 * Cockpit de l'enseignant : cours du jour + volumes.
 * RLS : l'enseignant ne voit que ses propres cours.
 */
export async function TeacherOverview({ userId }: { userId: string }) {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: courseRows } = await supabase
    .from("courses")
    .select("id, title")
    .eq("teacher_id", userId)
    .order("title");
  const courses = courseRows ?? [];
  const courseIds = courses.map((c) => c.id);
  const courseTitle = new Map(courses.map((c) => [c.id, c.title]));

  let todaySessions: {
    id: string;
    course_id: string;
    start_time: string;
    end_time: string;
    room: string | null;
  }[] = [];
  let studentCount = 0;

  if (courseIds.length > 0) {
    const dow = todayDow();
    const [{ data: slots }, { data: enr }] = await Promise.all([
      supabase
        .from("schedule_sessions")
        .select("id, course_id, day_of_week, start_time, end_time, room")
        .in("course_id", courseIds)
        .eq("day_of_week", dow)
        .order("start_time"),
      supabase.from("enrollments").select("student_id").in("course_id", courseIds),
    ]);
    todaySessions = slots ?? [];
    studentCount = new Set((enr ?? []).map((e) => e.student_id)).size;
  }

  const stat = (label: string, value: string) => (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
        {label}
      </p>
      <p className="mt-1 text-3xl font-extrabold text-ipmd-black">{value}</p>
    </div>
  );

  return (
    <div className="mt-8 space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {stat("Mes cours", String(courses.length))}
        {stat("Mes étudiants", String(studentCount))}
        {stat("Cours aujourd'hui", String(todaySessions.length))}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h3 className="font-bold text-ipmd-black">🗓️ Mes cours aujourd&apos;hui</h3>
        {todaySessions.length === 0 ? (
          <p className="mt-3 text-sm text-black/55">
            Aucune séance programmée aujourd&apos;hui. 🎉
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {todaySessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/espace/cours/${s.course_id}`}
                  className="flex items-center justify-between gap-3 rounded-lg bg-ipmd-light px-3 py-2 text-sm transition-colors hover:bg-black/5"
                >
                  <span className="min-w-0">
                    <span className="font-semibold text-ipmd-black">
                      {formatTime(s.start_time)}–{formatTime(s.end_time)}
                    </span>{" "}
                    <span className="text-black/70">
                      {courseTitle.get(s.course_id) ?? "Cours"}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-ipmd-red">
                    {s.room ? `🚪 ${s.room} · ` : ""}Ouvrir →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
