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
  const { supabase } = await requireUser();

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
