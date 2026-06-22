import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { SessionReportForm } from "@/components/espace/SessionReportForm";
import { formatTime, DAY_LABELS } from "@/lib/schedule";
import { SESSION_STATUS_LABEL, sessionStatusClass } from "@/lib/sessions";

export const metadata: Metadata = {
  title: "Mes séances",
};

function dayLabel(iso: string): string {
  const js = new Date(iso + "T00:00:00Z").getUTCDay();
  const dow = js === 0 ? 7 : js;
  const [, m, d] = iso.split("-");
  return `${DAY_LABELS[dow] ?? ""} ${d}/${m}`;
}

export default async function MesSeancesPage() {
  const { supabase, userId } = await requireUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (me?.role !== "enseignant") redirect("/espace");

  const { data: sessions } = await supabase
    .from("course_sessions")
    .select("id, class_id, subject, session_date, start_time, end_time, status")
    .eq("teacher_id", userId)
    .order("session_date", { ascending: false })
    .order("start_time")
    .limit(60);
  const list = sessions ?? [];

  const reports = new Map<string, Record<string, unknown>>();
  const className = new Map<string, string>();
  if (list.length > 0) {
    const sIds = list.map((s) => s.id);
    const classIds = [...new Set(list.map((s) => s.class_id))];
    const [{ data: reps }, { data: classes }] = await Promise.all([
      supabase
        .from("session_reports")
        .select("session_id, content, actual_start, actual_end, supports, observations, present_count, absent_count, validated")
        .in("session_id", sIds),
      supabase.from("classes").select("id, name").in("id", classIds),
    ]);
    for (const r of reps ?? []) reports.set(r.session_id, r);
    for (const c of classes ?? []) className.set(c.id, c.name);
  }

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/espace"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Mes séances
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Remplis la fiche pédagogique après chaque séance (la Pédagogie la
            valide).
          </p>

          {list.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucune séance générée pour tes cours. La Pédagogie génère les
              séances depuis le planning.
            </p>
          ) : (
            <ul className="mt-8 space-y-4">
              {list.map((s) => {
                const rep = reports.get(s.id) ?? {};
                const filled = Boolean(rep.content || rep.actual_start);
                const validated = rep.validated === true;
                return (
                  <li
                    key={s.id}
                    className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                  >
                    <details>
                      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold capitalize text-ipmd-black">
                            {dayLabel(s.session_date)} ·{" "}
                            {formatTime(s.start_time)}–{formatTime(s.end_time)}
                          </p>
                          <p className="text-xs text-black/55">
                            {s.subject} · {className.get(s.class_id) ?? "Classe"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {validated ? (
                            <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">
                              Fiche validée
                            </span>
                          ) : filled ? (
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                              Fiche remplie
                            </span>
                          ) : (
                            <span className="rounded-full bg-ipmd-red/10 px-2.5 py-1 text-[11px] font-bold text-ipmd-red">
                              À remplir
                            </span>
                          )}
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${sessionStatusClass(s.status)}`}
                          >
                            {SESSION_STATUS_LABEL[s.status] ?? s.status}
                          </span>
                        </div>
                      </summary>
                      <SessionReportForm sessionId={s.id} report={rep} />
                    </details>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}
