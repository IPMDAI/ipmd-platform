import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { GenerateSessionsForm } from "@/components/espace/GenerateSessionsForm";
import { SessionStatusSelect } from "@/components/espace/SessionStatusSelect";
import { formatTime, DAY_LABELS } from "@/lib/schedule";

export const metadata: Metadata = {
  title: "Séances",
};

const STAFF = ["admin", "super_admin", "pedagogie"];

function dayLabel(iso: string): string {
  const js = new Date(iso + "T00:00:00Z").getUTCDay();
  const dow = js === 0 ? 7 : js;
  const [, m, d] = iso.split("-");
  return `${DAY_LABELS[dow] ?? ""} ${d}/${m}`;
}

export default async function SeancesPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const { class: classId } = await searchParams;
  const { supabase, userId } = await requireUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (!STAFF.includes(me?.role ?? "")) redirect("/espace");

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .order("name");
  const classList = (classes ?? []).map((c) => ({ id: c.id, name: c.name }));

  let sessions: {
    id: string;
    teacher_id: string | null;
    subject: string;
    room_id: string | null;
    session_date: string;
    start_time: string;
    end_time: string;
    status: string;
  }[] = [];
  const teacherName = new Map<string, string>();
  const roomName = new Map<string, string>();
  if (classId) {
    const { data } = await supabase
      .from("course_sessions")
      .select("id, teacher_id, subject, room_id, session_date, start_time, end_time, status")
      .eq("class_id", classId)
      .order("session_date")
      .order("start_time");
    sessions = data ?? [];
    const tIds = [...new Set(sessions.map((s) => s.teacher_id).filter(Boolean))] as string[];
    const rIds = [...new Set(sessions.map((s) => s.room_id).filter(Boolean))] as string[];
    if (tIds.length > 0) {
      const { data: t } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", tIds);
      for (const p of t ?? []) teacherName.set(p.id, p.full_name || "—");
    }
    if (rIds.length > 0) {
      const { data: r } = await supabase.from("rooms").select("id, name").in("id", rIds);
      for (const x of r ?? []) roomName.set(x.id, x.name);
    }
  }

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/espace"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Séances datées
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Génère et suis les séances réelles, avec leur statut.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
            <div className="order-2 lg:order-1">
              {/* Sélecteur de classe */}
              {classList.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {classList.map((c) => (
                    <Link
                      key={c.id}
                      href={`/espace/seances?class=${c.id}`}
                      className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                        classId === c.id
                          ? "bg-ipmd-red text-white"
                          : "bg-white text-black/60 ring-1 ring-black/10 hover:text-ipmd-red"
                      }`}
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}

              {!classId ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Choisis une classe pour voir ses séances.
                </p>
              ) : sessions.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucune séance générée pour cette classe.
                </p>
              ) : (
                <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                  {sessions.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold capitalize text-ipmd-black">
                          {dayLabel(s.session_date)} ·{" "}
                          {formatTime(s.start_time)}–{formatTime(s.end_time)}
                        </p>
                        <p className="truncate text-xs text-black/55">
                          {s.subject}
                          {s.teacher_id && teacherName.get(s.teacher_id)
                            ? ` · 👤 ${teacherName.get(s.teacher_id)}`
                            : ""}
                          {s.room_id && roomName.get(s.room_id)
                            ? ` · 🚪 ${roomName.get(s.room_id)}`
                            : ""}
                        </p>
                      </div>
                      <SessionStatusSelect sessionId={s.id} current={s.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="order-1 lg:order-2">
              <GenerateSessionsForm classes={classList} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
