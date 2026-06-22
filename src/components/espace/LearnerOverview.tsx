import { createClient } from "@/lib/supabase/server";
import { averageValue, mention } from "@/lib/grades";
import { DAY_LABELS, formatTime } from "@/lib/schedule";
import { academicYear } from "@/lib/documents";

type Sess = {
  subject: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room_id: string | null;
};

/** Aujourd'hui au format planning (1 = Lundi … 7 = Dimanche). Abidjan = UTC. */
function todayDow(): number {
  const js = new Date().getUTCDay();
  return js === 0 ? 7 : js;
}
function nowTime(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:00`;
}

/** Prochain créneau à venir dans la semaine (en bouclant si besoin). */
function nextSession(slots: Sess[]): Sess | null {
  if (slots.length === 0) return null;
  const dow = todayDow();
  const t = nowTime();
  const sorted = [...slots].sort((a, b) =>
    a.day_of_week !== b.day_of_week
      ? a.day_of_week - b.day_of_week
      : a.start_time < b.start_time
      ? -1
      : 1
  );
  const later = sorted.find(
    (s) =>
      s.day_of_week > dow || (s.day_of_week === dow && s.start_time > t)
  );
  return later ?? sorted[0];
}

export async function LearnerOverview({ userId }: { userId: string }) {
  const supabase = await createClient();
  if (!supabase) return null;

  // Classe → niveau / filière.
  let className: string | null = null;
  let level: string | null = null;
  let filiereName: string | null = null;
  let classId: string | null = null;
  const { data: member } = await supabase
    .from("class_members")
    .select("class_id")
    .eq("student_id", userId)
    .maybeSingle();
  if (member?.class_id) {
    classId = member.class_id;
    const { data: klass } = await supabase
      .from("classes")
      .select("name, level, filiere_id")
      .eq("id", member.class_id)
      .single();
    className = klass?.name ?? null;
    level = klass?.level ?? null;
    if (klass?.filiere_id) {
      const { data: fil } = await supabase
        .from("filieres")
        .select("name")
        .eq("id", klass.filiere_id)
        .single();
      filiereName = fil?.name ?? null;
    }
  }

  // Planning de la classe (cours du jour + prochain cours).
  let slots: Sess[] = [];
  const roomName = new Map<string, string>();
  if (classId) {
    const { data: rows } = await supabase
      .from("timetable_slots")
      .select("subject, day_of_week, start_time, end_time, room_id")
      .eq("class_id", classId)
      .order("start_time");
    slots = (rows ?? []) as Sess[];
    const roomIds = [
      ...new Set(slots.map((s) => s.room_id).filter(Boolean) as string[]),
    ];
    if (roomIds.length > 0) {
      const { data: rooms } = await supabase
        .from("rooms")
        .select("id, name")
        .in("id", roomIds);
      for (const r of rooms ?? []) roomName.set(r.id, r.name);
    }
  }
  const dow = todayDow();
  const todaySessions = slots
    .filter((s) => s.day_of_week === dow)
    .sort((a, b) => (a.start_time < b.start_time ? -1 : 1));
  const next = nextSession(slots);

  // Notes.
  const { data: gradeRows } = await supabase
    .from("grades")
    .select("id, course_id, title, score, max_score, coefficient, created_at")
    .eq("student_id", userId)
    .order("created_at", { ascending: false });
  const grades = gradeRows ?? [];
  const avg = averageValue(grades);
  const recent = grades.slice(0, 4);
  const courseTitle = new Map<string, string>();
  const cids = [...new Set(recent.map((g) => g.course_id))];
  if (cids.length > 0) {
    const { data: courses } = await supabase
      .from("courses")
      .select("id, title")
      .in("id", cids);
    for (const c of courses ?? []) courseTitle.set(c.id, c.title);
  }

  // Scolarité (statut du solde).
  const { data: finance } = await supabase
    .from("student_finance")
    .select("total_due")
    .eq("student_id", userId)
    .maybeSingle();
  const { data: payRows } = await supabase
    .from("payments")
    .select("amount")
    .eq("student_id", userId);
  const totalDue = Number(finance?.total_due ?? 0);
  const totalPaid = (payRows ?? []).reduce((a, p) => a + Number(p.amount), 0);
  let scolarite: { label: string; cls: string };
  if (totalDue <= 0) scolarite = { label: "Non définie", cls: "bg-black/5 text-black/50" };
  else if (totalPaid >= totalDue) scolarite = { label: "À jour", cls: "bg-green-50 text-green-700" };
  else if (totalPaid > 0) scolarite = { label: "Partielle", cls: "bg-amber-50 text-amber-700" };
  else scolarite = { label: "En attente", cls: "bg-ipmd-red/10 text-ipmd-red" };

  const inscrit = className
    ? { label: "Inscrit", cls: "bg-green-50 text-green-700" }
    : { label: "En attente d'affectation", cls: "bg-amber-50 text-amber-700" };

  const programLine = [filiereName, level].filter(Boolean).join(" — ") || "Affectation à venir";

  return (
    <div className="mt-8 space-y-5">
      {/* Identité & statut */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-extrabold text-ipmd-black">
              {programLine}
            </p>
            <p className="text-sm text-black/55">
              {className ? `${className} · ` : ""}Année {academicYear()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${inscrit.cls}`}>
              {inscrit.label}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${scolarite.cls}`}>
              Scolarité : {scolarite.label}
            </span>
          </div>
        </div>

        {/* Prochain cours */}
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-ipmd-light px-4 py-3">
          <span className="text-xl">⏭️</span>
          {next ? (
            <p className="text-sm text-ipmd-black">
              <span className="font-semibold text-black/45">Prochain cours :</span>{" "}
              <span className="font-bold">{next.subject}</span> ·{" "}
              {DAY_LABELS[next.day_of_week] ?? ""} {formatTime(next.start_time)}–
              {formatTime(next.end_time)}
              {next.room_id && roomName.get(next.room_id)
                ? ` · 🚪 ${roomName.get(next.room_id)}`
                : ""}
            </p>
          ) : (
            <p className="text-sm text-black/55">
              Aucun cours planifié pour le moment.
            </p>
          )}
        </div>
      </div>

      {/* Aujourd'hui + résultats */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h3 className="font-bold text-ipmd-black">
            🗓️ Aujourd&apos;hui — {DAY_LABELS[dow] ?? ""}
          </h3>
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
                  {s.room_id && roomName.get(s.room_id) && (
                    <span className="shrink-0 text-xs text-black/45">
                      🚪 {roomName.get(s.room_id)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

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
    </div>
  );
}
