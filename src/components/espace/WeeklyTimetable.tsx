import {
  DAY_OPTIONS,
  formatTime,
  SLOT_STATUS_LABEL,
  slotStatusClass,
} from "@/lib/schedule";
import { shortDate } from "@/lib/holidays";

export type TimetableSlot = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: string;
  teacherName?: string | null;
  roomName?: string | null;
  status?: string | null;
};

/** Grille hebdomadaire en lecture seule (étudiant, parent, prof). */
export function WeeklyTimetable({
  slots,
  weekDates,
  holidays,
}: {
  slots: TimetableSlot[];
  weekDates?: Record<number, string>;
  holidays?: Record<string, string>;
}) {
  const byDay = new Map<number, TimetableSlot[]>();
  for (const s of slots) {
    const arr = byDay.get(s.day_of_week) ?? [];
    arr.push(s);
    byDay.set(s.day_of_week, arr);
  }
  for (const arr of byDay.values()) {
    arr.sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {DAY_OPTIONS.map((day) => {
        const list = byDay.get(day.value) ?? [];
        const date = weekDates?.[day.value];
        const holidayLabel = date ? holidays?.[date] : undefined;
        return (
          <div
            key={day.value}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
          >
            <h3 className="flex items-baseline justify-between gap-2 border-b border-black/5 pb-2 text-sm font-bold uppercase tracking-wide text-ipmd-black">
              <span>{day.label}</span>
              {date && (
                <span className="text-xs font-medium normal-case text-black/40">
                  {shortDate(date)}
                </span>
              )}
            </h3>
            {holidayLabel ? (
              <div className="mt-3 rounded-xl bg-ipmd-red/10 px-3 py-3 text-center">
                <p className="text-xs font-bold text-ipmd-red">Jour férié</p>
                <p className="text-xs text-ipmd-red/80">{holidayLabel}</p>
              </div>
            ) : list.length === 0 ? (
              <p className="mt-3 text-xs text-black/35">—</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {list.map((s) => {
                  const status = s.status ?? "prevu";
                  const canceled = status === "annule";
                  return (
                    <li
                      key={s.id}
                      className={`rounded-xl bg-ipmd-light p-3 ${
                        canceled ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-ipmd-red">
                          {formatTime(s.start_time)} – {formatTime(s.end_time)}
                        </p>
                        {status !== "prevu" && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${slotStatusClass(
                              status
                            )}`}
                          >
                            {SLOT_STATUS_LABEL[status]}
                          </span>
                        )}
                      </div>
                      <p
                        className={`mt-0.5 text-sm font-semibold text-ipmd-black ${
                          canceled ? "line-through" : ""
                        }`}
                      >
                        {s.subject}
                      </p>
                      {s.teacherName && (
                        <p className="text-xs text-black/55">👤 {s.teacherName}</p>
                      )}
                      {s.roomName && (
                        <p className="text-xs text-black/50">📍 {s.roomName}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
