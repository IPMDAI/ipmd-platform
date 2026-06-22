import type { Metadata } from "next";
import Link from "next/link";
import { requireTeacher } from "@/lib/require-teacher";
import { Container } from "@/components/ui/Container";
import { DAY_OPTIONS, formatTime } from "@/lib/schedule";

export const metadata: Metadata = {
  title: "Emploi du temps",
};

type Slot = {
  id: string;
  start_time: string;
  end_time: string;
  room: string | null;
  courseTitle: string;
};

export default async function EmploiDuTempsPage() {
  const { supabase, userId } = await requireTeacher();

  // Cours de l'enseignant.
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title")
    .eq("teacher_id", userId);

  const courseTitle: Record<string, string> = Object.fromEntries(
    (courses ?? []).map((c) => [c.id, c.title])
  );
  const courseIds = (courses ?? []).map((c) => c.id);

  // Séances de ces cours.
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

  // Regroupe par jour.
  const byDay: Record<number, Slot[]> = {};
  for (const s of sessions) {
    (byDay[s.day_of_week] ??= []).push({
      id: s.id,
      start_time: s.start_time,
      end_time: s.end_time,
      room: s.room,
      courseTitle: courseTitle[s.course_id] ?? "Cours",
    });
  }

  const total = sessions.length;

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/espace"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Emploi du temps
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Vos séances de la semaine. Ajoutez des créneaux depuis chaque cours.
          </p>

          {total === 0 ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucune séance planifiée. Ouvrez un cours depuis{" "}
              <Link href="/espace/cours" className="font-semibold text-ipmd-red">
                Mes cours
              </Link>{" "}
              pour ajouter des créneaux.
            </p>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {DAY_OPTIONS.map((day) => {
                const slots = byDay[day.value] ?? [];
                return (
                  <div
                    key={day.value}
                    className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                  >
                    <h2 className="border-b border-black/5 pb-2 text-sm font-bold uppercase tracking-wide text-ipmd-black">
                      {day.label}
                    </h2>
                    {slots.length === 0 ? (
                      <p className="mt-3 text-xs text-black/35">—</p>
                    ) : (
                      <ul className="mt-3 space-y-3">
                        {slots.map((s) => (
                          <li
                            key={s.id}
                            className="rounded-xl bg-ipmd-light p-3"
                          >
                            <p className="text-xs font-bold text-ipmd-red">
                              {formatTime(s.start_time)} – {formatTime(s.end_time)}
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-ipmd-black">
                              {s.courseTitle}
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
        </div>
      </Container>
    </section>
  );
}
