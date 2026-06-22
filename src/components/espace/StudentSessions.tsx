import { createClient } from "@/lib/supabase/server";
import { formatTime, DAY_LABELS } from "@/lib/schedule";
import { SESSION_STATUS_LABEL, sessionStatusClass } from "@/lib/sessions";
import { weekDates, shortDate } from "@/lib/holidays";

type Sess = {
  id: string;
  subject: string;
  teacher_name: string | null;
  teacher_function: string | null;
  room_name: string | null;
  session_date: string;
  start_time: string;
  end_time: string;
  status: string;
};

function dow(iso: string): number {
  const js = new Date(iso + "T00:00:00Z").getUTCDay();
  return js === 0 ? 7 : js;
}

/**
 * Séances datées de la semaine pour l'étudiant (vue simple : date, heure,
 * module, enseignant, salle, statut). Aucune donnée interne / financière.
 */
export async function StudentSessions({ classId }: { classId: string }) {
  const supabase = await createClient();
  if (!supabase) return null;

  const dates = weekDates();
  const { data } = await supabase
    .from("course_sessions")
    .select(
      "id, subject, teacher_name, teacher_function, room_name, session_date, start_time, end_time, status"
    )
    .eq("class_id", classId)
    .gte("session_date", dates[1])
    .lte("session_date", dates[6])
    .order("session_date")
    .order("start_time");
  const sessions = (data ?? []) as Sess[];
  if (sessions.length === 0) return null;

  const byDate = new Map<string, Sess[]>();
  for (const s of sessions) {
    const arr = byDate.get(s.session_date) ?? [];
    arr.push(s);
    byDate.set(s.session_date, arr);
  }

  return (
    <div className="space-y-4">
      {[...byDate.entries()].map(([date, list]) => (
        <div
          key={date}
          className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
        >
          <div className="flex items-center justify-between gap-3 bg-ipmd-light px-4 py-2">
            <span className="text-sm font-bold capitalize text-ipmd-black">
              {DAY_LABELS[dow(date)] ?? ""} {shortDate(date)}
            </span>
          </div>
          <ul className="divide-y divide-black/5">
            {list.map((s) => {
              const canceled =
                s.status === "annulee" ||
                s.status === "ferie" ||
                s.status === "absence_prof" ||
                s.status === "absence_classe";
              return (
                <li
                  key={s.id}
                  className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${
                    canceled ? "opacity-70" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold text-ipmd-black ${
                        canceled ? "line-through" : ""
                      }`}
                    >
                      <span className="text-ipmd-red">
                        {formatTime(s.start_time)}–{formatTime(s.end_time)}
                      </span>{" "}
                      {s.subject}
                    </p>
                    <p className="truncate text-xs text-black/55">
                      {s.teacher_name
                        ? `👤 ${s.teacher_name}${
                            s.teacher_function ? ` — ${s.teacher_function}` : ""
                          }`
                        : ""}
                      {s.room_name ? ` · 🚪 ${s.room_name}` : ""}
                    </p>
                  </div>
                  {s.status !== "prevue" && (
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${sessionStatusClass(
                        s.status
                      )}`}
                    >
                      {SESSION_STATUS_LABEL[s.status] ?? s.status}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
