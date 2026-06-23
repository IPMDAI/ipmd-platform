import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Présences",
};

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function rateClass(rate: number): string {
  if (rate >= 90) return "text-green-700";
  if (rate >= 75) return "text-amber-600";
  return "text-ipmd-red";
}

export default async function PresencesPage() {
  const { supabase } = await requireAdmin();

  // Nouveau système : appel par séance datée.
  const [{ data: att }, { data: sessions }] = await Promise.all([
    supabase.from("session_attendance").select("session_id, student_id, present"),
    supabase.from("course_sessions").select("id, subject, session_date"),
  ]);

  const marks = att ?? [];
  const sessionById = new Map((sessions ?? []).map((s) => [s.id, s]));

  const total = marks.length;
  const present = marks.filter((m) => m.present).length;
  const absent = total - present;
  const globalRate = total > 0 ? Math.round((present / total) * 100) : null;

  // Stats par module (subject).
  type ModuleStat = { subject: string; sessions: number; marks: number; present: number };
  const sessionsPerModule = new Map<string, Set<string>>();
  for (const s of sessions ?? []) {
    const set = sessionsPerModule.get(s.subject) ?? new Set<string>();
    set.add(s.id);
    sessionsPerModule.set(s.subject, set);
  }
  const byModule = new Map<string, ModuleStat>();
  for (const m of marks) {
    const sess = sessionById.get(m.session_id);
    if (!sess) continue;
    const key = sess.subject;
    const cur =
      byModule.get(key) ??
      {
        subject: key,
        sessions: sessionsPerModule.get(key)?.size ?? 0,
        marks: 0,
        present: 0,
      };
    cur.marks += 1;
    if (m.present) cur.present += 1;
    byModule.set(key, cur);
  }
  const moduleStats = [...byModule.values()].sort((a, b) => b.marks - a.marks);

  // Absences récentes.
  const absences = marks.filter((m) => !m.present);
  const absentIds = [...new Set(absences.map((a) => a.student_id))];
  const studentName = new Map<string, string>();
  if (absentIds.length > 0) {
    const { data: people } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", absentIds);
    for (const p of people ?? [])
      studentName.set(p.id, p.full_name || p.email || "—");
  }
  const recentAbsences = absences
    .map((a) => {
      const sess = sessionById.get(a.session_id);
      return {
        student: studentName.get(a.student_id) ?? "—",
        module: sess?.subject ?? "Module",
        date: sess?.session_date ?? "",
      };
    })
    .filter((a) => a.date)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 15);

  const stat = (label: string, value: string, accent?: string) => (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-extrabold ${accent ?? "text-ipmd-black"}`}>
        {value}
      </p>
    </div>
  );

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
            Présences
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Suivi de l&apos;assiduité — appel par séance.
          </p>

          {total === 0 ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucune présence enregistrée. Les enseignants font l&apos;appel
              depuis chaque séance (Mes séances → une séance → Faire l&apos;appel).
            </p>
          ) : (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stat(
                  "Taux de présence",
                  globalRate !== null ? `${globalRate}%` : "—",
                  globalRate !== null ? rateClass(globalRate) : undefined
                )}
                {stat("Séances", String(sessions?.length ?? 0))}
                {stat("Présences", String(present), "text-green-700")}
                {stat("Absences", String(absent), "text-ipmd-red")}
              </div>

              {/* Par module */}
              <h2 className="mt-10 text-lg font-bold text-ipmd-black">
                Assiduité par module
              </h2>
              <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wider text-black/40">
                      <th className="px-4 py-3 font-semibold">Module</th>
                      <th className="px-4 py-3 text-center font-semibold">Séances</th>
                      <th className="px-4 py-3 text-center font-semibold">Pointages</th>
                      <th className="px-4 py-3 text-right font-semibold">Taux</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moduleStats.map((c) => {
                      const rate = c.marks > 0 ? Math.round((c.present / c.marks) * 100) : 0;
                      return (
                        <tr key={c.subject} className="border-t border-black/5">
                          <td className="px-4 py-3 font-medium text-ipmd-black">
                            {c.subject}
                          </td>
                          <td className="px-4 py-3 text-center text-black/60">
                            {c.sessions}
                          </td>
                          <td className="px-4 py-3 text-center text-black/60">
                            {c.marks}
                          </td>
                          <td className={`px-4 py-3 text-right font-bold ${rateClass(rate)}`}>
                            {rate}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Absences récentes */}
              {recentAbsences.length > 0 && (
                <>
                  <h2 className="mt-10 text-lg font-bold text-ipmd-black">
                    Absences récentes
                  </h2>
                  <ul className="mt-3 divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                    {recentAbsences.map((a, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ipmd-black">
                            {a.student}
                          </p>
                          <p className="truncate text-black/50">{a.module}</p>
                        </div>
                        <span className="shrink-0 text-xs text-black/45">
                          {formatDate(a.date)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      </Container>
    </section>
  );
}
