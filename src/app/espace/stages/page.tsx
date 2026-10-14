import type { Metadata } from "next";
import Link from "next/link";
import { requireAcademic } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { InternshipCreateForm, type Opt } from "@/components/espace/stages/InternshipCreateForm";
import {
  INTERNSHIP_STATUS,
  INTERNSHIP_STATUS_ORDER,
  type InternshipStatus,
} from "@/lib/internships";

export const metadata: Metadata = { title: "Stages" };

type SP = Record<string, string | undefined>;

function fmt(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

type Row = {
  id: string;
  title: string | null;
  student_name: string | null;
  academic_year: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  host_company_id: string | null;
  host_companies: { name: string | null; city: string | null } | null;
};

/**
 * Espace Directeur des Études — liste des stages (D8-UI-1), filtrable par
 * année / statut / étudiant / entreprise. Lecture via la RLS staff (D8-1).
 */
export default async function StagesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const { supabase } = await requireAcademic();
  const sp = await searchParams;
  const fYear = (sp.year ?? "").trim();
  const fStatus = (sp.status ?? "").trim();
  const fStudent = (sp.student ?? "").trim();
  const fCompany = (sp.company ?? "").trim();

  // Liste filtrée (RLS staff).
  let qb = supabase
    .from("internships")
    .select(
      "id, title, student_name, academic_year, status, start_date, end_date, host_company_id, host_companies(name, city)"
    );
  if (fYear) qb = qb.eq("academic_year", fYear);
  if (fStatus) qb = qb.eq("status", fStatus);
  if (fStudent) qb = qb.eq("student_id", fStudent);
  if (fCompany) qb = qb.eq("host_company_id", fCompany);
  const { data: rowsRaw } = await qb.order("created_at", { ascending: false }).limit(300);
  const rows = (rowsRaw ?? []) as unknown as Row[];

  // Options (filtres + création).
  const [{ data: years }, { data: companies }, { data: students }, { data: modules }] =
    await Promise.all([
      supabase.from("academic_years").select("year, status").order("year", { ascending: false }),
      supabase.from("host_companies").select("id, name, status").order("name"),
      supabase.from("profiles").select("id, full_name, matricule").eq("role", "etudiant").order("full_name").limit(2000),
      supabase.from("modules").select("id, name, level").order("name"),
    ]);

  const yearOpts: Opt[] = (years ?? []).map((y) => ({ value: y.year, label: y.year }));
  const activeCompanyOpts: Opt[] = (companies ?? [])
    .filter((c) => c.status !== "archive")
    .map((c) => ({ value: c.id, label: c.name }));
  const allCompanyOpts = (companies ?? []).map((c) => ({
    value: c.id,
    label: c.status === "archive" ? `${c.name} (archivée)` : c.name,
  }));
  const studentOpts: Opt[] = (students ?? []).map((s) => ({
    value: s.id,
    label: s.matricule ? `${s.full_name} · ${s.matricule}` : s.full_name,
  }));
  const moduleOpts: Opt[] = (modules ?? []).map((m) => ({
    value: m.id,
    label: m.level ? `${m.name} (${m.level})` : m.name,
  }));

  const selCls = "rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-sm";

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">Stages</h1>
          <p className="mt-1 text-sm text-black/55">
            Suivi pédagogique des stages. La signature juridique de la convention relève de
            l&apos;Administrateur Général.
          </p>

          {/* Création */}
          <details className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <summary className="cursor-pointer text-base font-bold text-ipmd-black">
              ➕ Nouveau stage
            </summary>
            <div className="mt-4">
              <InternshipCreateForm
                students={studentOpts}
                companies={activeCompanyOpts}
                years={yearOpts}
                modules={moduleOpts}
              />
            </div>
          </details>

          {/* Filtres (GET → server) */}
          <form method="get" className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-black/55">Année</span>
              <select name="year" defaultValue={fYear} className={selCls}>
                <option value="">Toutes</option>
                {yearOpts.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-black/55">Statut</span>
              <select name="status" defaultValue={fStatus} className={selCls}>
                <option value="">Tous</option>
                {INTERNSHIP_STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>{INTERNSHIP_STATUS[s].label}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-black/55">Étudiant</span>
              <select name="student" defaultValue={fStudent} className={selCls}>
                <option value="">Tous</option>
                {studentOpts.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-black/55">Entreprise</span>
              <select name="company" defaultValue={fCompany} className={selCls}>
                <option value="">Toutes</option>
                {allCompanyOpts.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <button className="rounded-lg bg-ipmd-black px-3 py-1.5 text-sm font-semibold text-white">
              Filtrer
            </button>
            <Link href="/espace/stages" className="rounded-lg px-3 py-1.5 text-sm font-semibold ring-1 ring-black/15 hover:bg-black/5">
              Réinitialiser
            </Link>
          </form>

          {/* Liste */}
          <div className="mt-6">
            <h2 className="text-lg font-bold text-ipmd-black">
              Résultats <span className="text-black/40">({rows.length})</span>
            </h2>
            {rows.length === 0 ? (
              <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                Aucun stage.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {rows.map((r) => {
                  const badge = INTERNSHIP_STATUS[r.status as InternshipStatus];
                  return (
                    <li key={r.id}>
                      <Link
                        href={`/espace/stage/${r.id}`}
                        className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition-colors hover:ring-ipmd-red/30"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-ipmd-black">{r.student_name ?? "—"}</p>
                            <p className="mt-0.5 text-sm text-black/60">{r.title ?? "—"}</p>
                            <p className="mt-0.5 text-xs text-black/45">
                              {r.host_companies?.name ?? "—"}
                              {r.host_companies?.city ? ` · ${r.host_companies.city}` : ""}
                              {r.academic_year ? ` · ${r.academic_year}` : ""}
                              {` · ${fmt(r.start_date)} → ${fmt(r.end_date)}`}
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
