import type { Metadata } from "next";
import Link from "next/link";
import { requireAcademic } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { AcademicWorkCreateForm, type Opt } from "@/components/espace/works/AcademicWorkCreateForm";
import {
  WORK_TYPES,
  WORK_TYPE_LABEL,
  WORK_STATUS,
  WORK_STATUS_ORDER,
  type WorkStatus,
} from "@/lib/academic-works";

export const metadata: Metadata = { title: "Travaux" };

type SP = Record<string, string | undefined>;

type Row = {
  id: string;
  title: string | null;
  student_name: string | null;
  work_type: string;
  academic_year: string | null;
  status: string;
  academic_advisor_id: string | null;
  academic_advisor_name: string | null;
};

export default async function TravauxPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { supabase } = await requireAcademic();
  const sp = await searchParams;
  const fYear = (sp.year ?? "").trim();
  const fType = (sp.type ?? "").trim();
  const fStatus = (sp.status ?? "").trim();
  const fStudent = (sp.student ?? "").trim();
  const fAdvisor = (sp.advisor ?? "").trim();

  let qb = supabase
    .from("academic_works")
    .select(
      "id, title, student_name, work_type, academic_year, status, academic_advisor_id, academic_advisor_name"
    );
  if (fYear) qb = qb.eq("academic_year", fYear);
  if (fType) qb = qb.eq("work_type", fType);
  if (fStatus) qb = qb.eq("status", fStatus);
  if (fStudent) qb = qb.eq("student_id", fStudent);
  if (fAdvisor) qb = qb.eq("academic_advisor_id", fAdvisor);
  const { data: rowsRaw } = await qb.order("created_at", { ascending: false }).limit(300);
  const rows = (rowsRaw ?? []) as Row[];

  // Options (filtres + création).
  const [{ data: years }, { data: students }, { data: internships }, { data: advisorsRaw }] =
    await Promise.all([
      supabase.from("academic_years").select("year").order("year", { ascending: false }),
      supabase.from("profiles").select("id, full_name, matricule").eq("role", "etudiant").order("full_name").limit(2000),
      supabase.from("internships").select("id, student_name, title").order("created_at", { ascending: false }).limit(500),
      supabase.from("academic_works").select("academic_advisor_id, academic_advisor_name").not("academic_advisor_id", "is", null),
    ]);

  const yearOpts: Opt[] = (years ?? []).map((y) => ({ value: y.year, label: y.year }));
  const studentOpts: Opt[] = (students ?? []).map((st) => ({
    value: st.id,
    label: st.matricule ? `${st.full_name} · ${st.matricule}` : st.full_name,
  }));
  const internshipOpts: Opt[] = (internships ?? []).map((i) => ({
    value: i.id,
    label: `${i.student_name ?? "—"} — ${i.title ?? "stage"}`,
  }));
  const advisorMap = new Map<string, string>();
  for (const a of advisorsRaw ?? [])
    if (a.academic_advisor_id) advisorMap.set(a.academic_advisor_id, a.academic_advisor_name ?? "—");
  const advisorOpts = [...advisorMap.entries()].map(([value, label]) => ({ value, label }));

  const selCls = "rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-sm";

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">
            Mémoires, rapports & PFE
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Suivi des travaux académiques. Le dépôt du fichier passe par le système documentaire
            de l&apos;étudiant ; les statuts sont gérés par la base.
          </p>

          <details className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <summary className="cursor-pointer text-base font-bold text-ipmd-black">
              ➕ Nouveau travail
            </summary>
            <div className="mt-4">
              <AcademicWorkCreateForm students={studentOpts} years={yearOpts} internships={internshipOpts} />
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
              <span className="text-xs font-semibold text-black/55">Type</span>
              <select name="type" defaultValue={fType} className={selCls}>
                <option value="">Tous</option>
                {WORK_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-black/55">Statut</span>
              <select name="status" defaultValue={fStatus} className={selCls}>
                <option value="">Tous</option>
                {WORK_STATUS_ORDER.map((st) => (<option key={st} value={st}>{WORK_STATUS[st].label}</option>))}
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
              <span className="text-xs font-semibold text-black/55">Encadreur</span>
              <select name="advisor" defaultValue={fAdvisor} className={selCls}>
                <option value="">Tous</option>
                {advisorOpts.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
              </select>
            </label>
            <button className="rounded-lg bg-ipmd-black px-3 py-1.5 text-sm font-semibold text-white">Filtrer</button>
            <Link href="/espace/travaux" className="rounded-lg px-3 py-1.5 text-sm font-semibold ring-1 ring-black/15 hover:bg-black/5">
              Réinitialiser
            </Link>
          </form>

          <div className="mt-6">
            <h2 className="text-lg font-bold text-ipmd-black">
              Résultats <span className="text-black/40">({rows.length})</span>
            </h2>
            {rows.length === 0 ? (
              <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                Aucun travail.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {rows.map((r) => {
                  const badge = WORK_STATUS[r.status as WorkStatus];
                  return (
                    <li key={r.id}>
                      <Link
                        href={`/espace/travail/${r.id}`}
                        className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition-colors hover:ring-ipmd-red/30"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-ipmd-black">{r.student_name ?? "—"}</p>
                            <p className="mt-0.5 text-sm text-black/60">{r.title ?? "—"}</p>
                            <p className="mt-0.5 text-xs text-black/45">
                              {WORK_TYPE_LABEL[r.work_type] ?? r.work_type}
                              {r.academic_year ? ` · ${r.academic_year}` : ""}
                              {r.academic_advisor_name ? ` · ${r.academic_advisor_name}` : " · encadreur non affecté"}
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
