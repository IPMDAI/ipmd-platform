import { createClient } from "@/lib/supabase/server";
import { averageValue, mention } from "@/lib/grades";
import { DAY_LABELS, formatTime } from "@/lib/schedule";

/** Aujourd'hui au format planning (1 = Lundi … 7 = Dimanche). */
function todayDow(): number {
  const js = new Date().getDay(); // 0 = Dimanche
  return js === 0 ? 7 : js;
}

/**
 * Cockpit de l'apprenant : moyenne, cours du jour, dernières notes.
 * Tout est filtré par la RLS (l'étudiant ne voit que ses données).
 */
export async function LearnerOverview({ userId }: { userId: string }) {
  const supabase = await createClient();
  if (!supabase) return null;

  // Notes.
  const { data: gradeRows } = await supabase
    .from("grades")
    .select("id, course_id, title, score, max_score, coefficient, created_at")
    .eq("student_id", userId)
    .order("created_at", { ascending: false });
  const grades = gradeRows ?? [];
  const avg = averageValue(grades);
  const recent = grades.slice(0, 4);

  // Cours du jour (planning de la classe).
  const dow = todayDow();
  let todaySessions: {
    subject: string;
    start_time: string;
    end_time: string;
    room: string | null;
  }[] = [];
  const { data: member } = await supabase
    .from("class_members")
    .select("class_id")
    .eq("student_id", userId)
    .maybeSingle();
  if (member?.class_id) {
    const { data: slots } = await supabase
      .from("timetable_slots")
      .select("subject, start_time, end_time, room_id, day_of_week")
      .eq("class_id", member.class_id)
      .eq("day_of_week", dow)
      .order("start_time");
    const roomIds = [
      ...new Set((slots ?? []).map((s) => s.room_id).filter(Boolean) as string[]),
    ];
    const roomName = new Map<string, string>();
    if (roomIds.length > 0) {
      const { data: rooms } = await supabase
        .from("rooms")
        .select("id, name")
        .in("id", roomIds);
      for (const r of rooms ?? []) roomName.set(r.id, r.name);
    }
    todaySessions = (slots ?? []).map((s) => ({
      subject: s.subject,
      start_time: s.start_time,
      end_time: s.end_time,
      room: s.room_id ? roomName.get(s.room_id) ?? null : null,
    }));
  }

  // Titres des cours pour les notes récentes.
  const courseTitle = new Map<string, string>();
  const cids = [...new Set(recent.map((g) => g.course_id))];
  if (cids.length > 0) {
    const { data: courses } = await supabase
      .from("courses")
      .select("id, title")
      .in("id", cids);
    for (const c of courses ?? []) courseTitle.set(c.id, c.title);
  }

  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-2">
      {/* Aujourd'hui */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-ipmd-black">
            🗓️ Aujourd&apos;hui — {DAY_LABELS[dow] ?? ""}
          </h3>
          {todaySessions.length > 0 && (
            <span className="rounded-full bg-ipmd-light px-2 py-0.5 text-xs font-bold text-black/60">
              {todaySessions.length}
            </span>
          )}
        </div>
        {todaySessions.length === 0 ? (
          <p className="mt-3 text-sm text-black/55">
            Pas de cours programmé aujourd&apos;hui. 🎉
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {todaySessions.map((s, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg bg-ipmd-light px-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="font-semibold text-ipmd-black">
                    {formatTime(s.start_time)}–{formatTime(s.end_time)}
                  </span>{" "}
                  <span className="text-black/70">{s.subject}</span>
                </span>
                {s.room && (
                  <span className="shrink-0 text-xs text-black/45">
                    🚪 {s.room}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Mes résultats */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-ipmd-black">📊 Mes derniers résultats</h3>
          <span className="text-sm font-extrabold text-ipmd-red">
            {avg !== null ? `${avg}/20` : "—"}
            {avg !== null && (
              <span className="ml-1 text-xs font-semibold text-black/45">
                {mention(avg)}
              </span>
            )}
          </span>
        </div>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-black/55">
            Aucune note pour l&apos;instant.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recent.map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="min-w-0">
                  <span className="font-medium text-ipmd-black">
                    {courseTitle.get(g.course_id) ?? "Cours"}
                  </span>
                  <span className="text-black/45"> · {g.title}</span>
                </span>
                <span className="shrink-0 font-semibold text-ipmd-black">
                  {Number(g.score)}/{Number(g.max_score)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
