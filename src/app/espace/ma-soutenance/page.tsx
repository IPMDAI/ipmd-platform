import type { Metadata } from "next";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { DEFENSE_STATUS, attemptLabel, JURY_ROLE_LABEL, JURY_DECISION_LABEL, type DefenseStatus } from "@/lib/defenses";

export const metadata: Metadata = { title: "Ma soutenance" };

function fmt(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

type MyDefense = {
  id: string;
  work_title: string | null;
  attempt: number;
  scheduled_at: string | null;
  room_name: string | null;
  status: string;
  academic_year: string | null;
};
type JuryRow = { member_type: string; display_name: string | null; role: string; organization: string | null };
type ResultRow = { final_score: number | null; mention: string | null; jury_decision: string | null };

/**
 * Espace étudiant — « Ma soutenance » (D8-UI-3). Lecture EXCLUSIVEMENT via les
 * 3 RPC dédiées. L'étudiant ne voit jamais : notes/abstentions individuelles,
 * commentaires internes, membres retirés, brouillon de délibération, données RH.
 * Le résultat n'apparaît qu'APRÈS validation pédagogique (RPC le garantit).
 */
export default async function MaSoutenancePage() {
  const { supabase } = await requireUser();
  const { data: defs } = await supabase.rpc("student_my_defenses");
  const defenses = (defs ?? []) as MyDefense[];

  // Jury actif + résultat validé pour chaque soutenance (RPC dédiées).
  const enriched = await Promise.all(
    defenses.map(async (d) => {
      const [juryRes, resRes] = await Promise.all([
        supabase.rpc("student_my_defense_jury", { p_defense: d.id }),
        supabase.rpc("student_my_defense_result", { p_defense: d.id }),
      ]);
      const jury = (juryRes.data ?? []) as JuryRow[];
      const result = ((resRes.data ?? [])[0] ?? null) as ResultRow | null;
      return { d, jury, result };
    })
  );

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">Ma soutenance</h1>
          <p className="mt-1 text-sm text-black/55">Date, jury et résultat de votre soutenance.</p>

          {enriched.length === 0 ? (
            <p className="mt-6 rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucune soutenance programmée pour le moment.
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {enriched.map(({ d, jury, result }) => {
                const badge = DEFENSE_STATUS[d.status as DefenseStatus];
                return (
                  <li key={d.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-ipmd-black">
                          {d.work_title ?? "Soutenance"}
                          <span className="ml-2 rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold text-black/55">{attemptLabel(d.attempt)}</span>
                        </p>
                        <p className="mt-0.5 text-sm text-black/55">{d.academic_year ?? ""}</p>
                      </div>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge?.cls ?? ""}`}>{badge?.label ?? d.status}</span>
                    </div>

                    <div className="mt-3 border-t border-black/5 pt-3 text-sm text-black/70">
                      <p>📅 {fmt(d.scheduled_at)}</p>
                      <p className="mt-0.5">🚪 {d.room_name ?? "Salle à préciser"}</p>
                    </div>

                    {jury.length > 0 && (
                      <div className="mt-3 border-t border-black/5 pt-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Jury</p>
                        <ul className="mt-1 space-y-0.5 text-sm text-black/70">
                          {jury.map((j, i) => (
                            <li key={i}>
                              {j.display_name ?? "—"} — {JURY_ROLE_LABEL[j.role] ?? j.role}
                              {j.organization ? ` · ${j.organization}` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-3 border-t border-black/5 pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Résultat</p>
                      {result ? (
                        <p className="mt-1 text-sm font-semibold text-emerald-700">
                          {result.final_score}/20 · {result.mention} · {JURY_DECISION_LABEL[result.jury_decision ?? ""] ?? result.jury_decision}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-black/50">Non communiqué (en attente de validation).</p>
                      )}
                    </div>
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
