import type { Metadata } from "next";
import Link from "next/link";
import { requireAcademic } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { DefenseCreateForm, type Opt } from "@/components/espace/defenses/DefenseCreateForm";
import {
  DEFENSE_STATUS,
  DEFENSE_STATUS_ORDER,
  attemptLabel,
  type DefenseStatus,
} from "@/lib/defenses";
import { WORK_TYPES, WORK_TYPE_LABEL } from "@/lib/academic-works";

export const metadata: Metadata = { title: "Soutenances" };

type SP = Record<string, string | undefined>;

function fmt(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

type Row = {
  id: string;
  student_name: string | null;
  work_title: string | null;
  attempt: number;
  scheduled_at: string | null;
  room_name: string | null;
  status: string;
  academic_year: string | null;
  academic_works: { work_type: string | null } | null;
};

export default async function SoutenancesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { supabase } = await requireAcademic();
  const sp = await searchParams;
  const fYear = (sp.year ?? "").trim();
  const fStatus = (sp.status ?? "").trim();
  const fStudent = (sp.student ?? "").trim();
  const fType = (sp.type ?? "").trim();

  let qb = supabase
    .from("defenses")
    .select(
      "id, student_name, work_title, attempt, scheduled_at, room_name, status, academic_year, academic_work_id, academic_works(work_type)"
    );
  if (fYear) qb = qb.eq("academic_year", fYear);
  if (fStatus) qb = qb.eq("status", fStatus);
  if (fStudent) qb = qb.eq("student_id", fStudent);
  const { data: rowsRaw } = await qb.order("created_at", { ascending: false }).limit(300);
  let rows = (rowsRaw ?? []) as unknown as Row[];
  // Filtre « type de travail » (sur l'entité liée) — simple filtrage de données.
  if (fType) rows = rows.filter((r) => r.academic_works?.work_type === fType);

  const [{ data: years }, { data: students }, { data: works }] = await Promise.all([
    supabase.from("academic_years").select("year").order("year", { ascending: false }),
    supabase.from("profiles").select("id, full_name, matricule").eq("role", "etudiant").order("full_name").limit(2000),
    supabase.from("academic_works").select("id, student_name, title, work_type").eq("status", "valide").order("created_at", { ascending: false }).limit(500),
  ]);

  const yearOpts: Opt[] = (years ?? []).map((y) => ({ value: y.year, label: y.year }));
  const studentOpts: Opt[] = (students ?? []).map((st) => ({
    value: st.id, label: st.matricule ? `${st.full_name} · ${st.matricule}` : st.full_name,
  }));
  const workOpts: Opt[] = (works ?? []).map((w) => ({
    value: w.id, label: `${w.student_name ?? "—"} — ${w.title ?? "travail"} (${WORK_TYPE_LABEL[w.work_type] ?? w.work_type})`,
  }));

  const selCls = "rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-sm";

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">Soutenances</h1>
          <p className="mt-1 text-sm text-black/55">
            Jurys, évaluations et délibérations. Le résultat n&apos;est visible par l&apos;étudiant
            qu&apos;après validation pédagogique.
          </p>

          <details className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <summary className="cursor-pointer text-base font-bold text-ipmd-black">➕ Nouvelle soutenance</summary>
            <div className="mt-4">
              <DefenseCreateForm works={workOpts} />
            </div>
          </details>

          <form method="get" className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-black/55">Année</span>
              <select name="year" defaultValue={fYear} className={selCls}>
                <option value="">Toutes</option>
                {yearOpts.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-black/55">Statut</span>
              <select name="status" defaultValue={fStatus} className={selCls}>
                <option value="">Tous</option>
                {DEFENSE_STATUS_ORDER.map((st) => (<option key={st} value={st}>{DEFENSE_STATUS[st].label}</option>))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-black/55">Étudiant</span>
              <select name="student" defaultValue={fStudent} className={selCls}>
                <option value="">Tous</option>
                {studentOpts.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-black/55">Type de travail</span>
              <select name="type" defaultValue={fType} className={selCls}>
                <option value="">Tous</option>
                {WORK_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
              </select>
            </label>
            <button className="rounded-lg bg-ipmd-black px-3 py-1.5 text-sm font-semibold text-white">Filtrer</button>
            <Link href="/espace/soutenances" className="rounded-lg px-3 py-1.5 text-sm font-semibold ring-1 ring-black/15 hover:bg-black/5">Réinitialiser</Link>
          </form>

          <div className="mt-6">
            <h2 className="text-lg font-bold text-ipmd-black">
              Résultats <span className="text-black/40">({rows.length})</span>
            </h2>
            {rows.length === 0 ? (
              <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">Aucune soutenance.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {rows.map((r) => {
                  const badge = DEFENSE_STATUS[r.status as DefenseStatus];
                  return (
                    <li key={r.id}>
                      <Link href={`/espace/soutenance/${r.id}`} className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition-colors hover:ring-ipmd-red/30">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-ipmd-black">
                              {r.student_name ?? "—"}
                              <span className="ml-2 rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold text-black/55">
                                {attemptLabel(r.attempt)}
                              </span>
                            </p>
                            <p className="mt-0.5 text-sm text-black/60">{r.work_title ?? "—"}</p>
                            <p className="mt-0.5 text-xs text-black/45">
                              {r.academic_works?.work_type ? `${WORK_TYPE_LABEL[r.academic_works.work_type] ?? r.academic_works.work_type} · ` : ""}
                              {fmt(r.scheduled_at)}
                              {r.room_name ? ` · ${r.room_name}` : ""}
                            </p>
                          </div>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge?.cls ?? ""}`}>
                            {badge?.label ?? r.status}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
