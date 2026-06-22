import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { NewSlotForm } from "@/components/espace/NewSlotForm";
import { NotifyClassButton } from "@/components/espace/NotifyClassButton";
import { removeTimetableSlot } from "@/lib/planning-actions";
import { DAY_OPTIONS, formatTime } from "@/lib/schedule";

export const metadata: Metadata = {
  title: "Planning de la classe",
};

export default async function ClassPlanningPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const { supabase } = await requireAdmin();

  const { data: klass } = await supabase
    .from("classes")
    .select("id, name, level, academic_year")
    .eq("id", classId)
    .single();
  if (!klass) notFound();

  const [{ data: slots }, { data: teachers }, { data: rooms }] =
    await Promise.all([
      supabase
        .from("timetable_slots")
        .select("id, subject, teacher_id, room_id, day_of_week, start_time, end_time")
        .eq("class_id", classId)
        .order("start_time"),
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "enseignant")
        .order("full_name"),
      supabase.from("rooms").select("id, name").order("name"),
    ]);

  const teacherName = new Map(
    (teachers ?? []).map((t) => [t.id, t.full_name || t.email])
  );
  const roomName = new Map((rooms ?? []).map((r) => [r.id, r.name]));

  const byDay = new Map<number, typeof slots>();
  for (const s of slots ?? []) {
    const arr = byDay.get(s.day_of_week) ?? [];
    arr.push(s);
    byDay.set(s.day_of_week, arr);
  }

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/espace/planning"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Toutes les classes
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Planning — {klass.name}
          </h1>
          <p className="mt-1 text-sm text-black/55">
            {[klass.level, klass.academic_year].filter(Boolean).join(" · ") ||
              "Emploi du temps de la semaine"}
          </p>

          <div className="mt-4">
            <NotifyClassButton classId={classId} />
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
            {/* Grille hebdomadaire */}
            <div className="order-2 grid gap-4 sm:grid-cols-2 lg:order-1 lg:grid-cols-3">
              {DAY_OPTIONS.map((day) => {
                const list = byDay.get(day.value) ?? [];
                return (
                  <div
                    key={day.value}
                    className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                  >
                    <h3 className="border-b border-black/5 pb-2 text-sm font-bold uppercase tracking-wide text-ipmd-black">
                      {day.label}
                    </h3>
                    {list.length === 0 ? (
                      <p className="mt-3 text-xs text-black/35">—</p>
                    ) : (
                      <ul className="mt-3 space-y-3">
                        {list.map((s) => (
                          <li key={s.id} className="rounded-xl bg-ipmd-light p-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-bold text-ipmd-red">
                                {formatTime(s.start_time)} –{" "}
                                {formatTime(s.end_time)}
                              </p>
                              <form
                                action={removeTimetableSlot.bind(
                                  null,
                                  classId,
                                  s.id
                                )}
                              >
                                <button
                                  type="submit"
                                  className="text-[11px] font-bold text-ipmd-red hover:underline"
                                  aria-label="Supprimer"
                                >
                                  ✕
                                </button>
                              </form>
                            </div>
                            <p className="mt-0.5 text-sm font-semibold text-ipmd-black">
                              {s.subject}
                            </p>
                            {s.teacher_id && teacherName.get(s.teacher_id) && (
                              <p className="text-xs text-black/55">
                                👤 {teacherName.get(s.teacher_id)}
                              </p>
                            )}
                            {s.room_id && roomName.get(s.room_id) && (
                              <p className="text-xs text-black/50">
                                📍 {roomName.get(s.room_id)}
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

            {/* Formulaire */}
            <div className="order-1 lg:order-2">
              <NewSlotForm
                classId={classId}
                teachers={(teachers ?? []).map((t) => ({
                  id: t.id,
                  name: t.full_name || t.email,
                }))}
                rooms={(rooms ?? []).map((r) => ({ id: r.id, name: r.name }))}
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
