import { createClient } from "@/lib/supabase/server";

function frDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** Suivi des présences/absences de l'étudiant (système séances datées).
 *  Aucune donnée sensible : seulement date / module / présent ou absent. */
export async function StudentAttendance({ studentId }: { studentId: string }) {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: att } = await supabase
    .from("session_attendance")
    .select("session_id, present")
    .eq("student_id", studentId);
  if (!att || att.length === 0) return null;

  const ids = att.map((a) => a.session_id);
  const { data: sessions } = await supabase
    .from("course_sessions")
    .select("id, session_date, subject, teacher_name")
    .in("id", ids);
  const sMap = new Map((sessions ?? []).map((s) => [s.id, s]));

  const rows = att
    .map((a) => ({ present: a.present, s: sMap.get(a.session_id) }))
    .filter((r): r is { present: boolean; s: NonNullable<typeof r.s> } => Boolean(r.s))
    .sort((a, b) => (a.s.session_date < b.s.session_date ? 1 : -1));

  const total = rows.length;
  const absences = rows.filter((r) => !r.present).length;
  const rate = total ? Math.round(((total - absences) / total) * 100) : 0;

  return (
    <div>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-black/40">
        Mes présences
      </h2>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        {/* Résumé */}
        <div className="flex flex-wrap items-center gap-6 border-b border-black/5 p-5">
          <div>
            <p className="text-3xl font-extrabold text-ipmd-black">{rate}%</p>
            <p className="text-xs text-black/50">Taux de présence</p>
          </div>
          <div>
            <p
              className={`text-3xl font-extrabold ${
                absences > 0 ? "text-ipmd-red" : "text-green-600"
              }`}
            >
              {absences}
            </p>
            <p className="text-xs text-black/50">
              Absence{absences > 1 ? "s" : ""} sur {total} séance{total > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {/* Détail */}
        <ul className="divide-y divide-black/5">
          {rows.slice(0, 12).map((r, i) => (
            <li key={i} className="flex items-center justify-between gap-3 px-5 py-2.5">
              <span className="min-w-0">
                <span className="text-sm font-medium text-ipmd-black">{r.s.subject}</span>
                <span className="ml-2 text-xs capitalize text-black/45">
                  {frDate(r.s.session_date)}
                </span>
              </span>
              {r.present ? (
                <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">
                  Présent
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-ipmd-red/10 px-2.5 py-1 text-[11px] font-bold text-ipmd-red">
                  Absent
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
