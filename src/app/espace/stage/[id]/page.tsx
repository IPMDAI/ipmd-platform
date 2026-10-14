import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAcademic } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { StageActions } from "@/components/espace/stages/StageActions";
import type { Opt } from "@/components/espace/stages/InternshipCreateForm";
import { INTERNSHIP_STATUS, type InternshipStatus } from "@/lib/internships";

export const metadata: Metadata = { title: "Stage" };

function fmt(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return "—";
  }
}

type Internship = {
  id: string;
  student_name: string | null;
  academic_year: string | null;
  title: string | null;
  mission: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  host_company_id: string | null;
  academic_advisor_id: string | null;
  academic_advisor_name: string | null;
  module_id: string | null;
  supervisor_name: string | null;
  supervisor_function: string | null;
  supervisor_email: string | null;
  supervisor_phone: string | null;
  host_companies: { name: string | null; city: string | null; status: string | null } | null;
  modules: { name: string | null; level: string | null } | null;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-black/40">{label}</dt>
      <dd className="mt-0.5 text-sm text-ipmd-black">{children}</dd>
    </div>
  );
}

export default async function StageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAcademic();

  const { data } = await supabase
    .from("internships")
    .select(
      "id, student_name, academic_year, title, mission, start_date, end_date, status, host_company_id, academic_advisor_id, academic_advisor_name, module_id, supervisor_name, supervisor_function, supervisor_email, supervisor_phone, host_companies(name, city, status), modules(name, level)"
    )
    .eq("id", id)
    .single();
  const stage = data as unknown as Internship | null;
  if (!stage) notFound();

  // Options d'actions : entreprises actives + encadreurs éligibles (liste DÉ-safe D7-1).
  const [{ data: companies }, { data: teachers }] = await Promise.all([
    supabase.from("host_companies").select("id, name, status").eq("status", "actif").order("name"),
    supabase.rpc("pedagogical_teachers"),
  ]);
  const companyOpts: Opt[] = (companies ?? []).map((c) => ({ value: c.id, label: c.name }));
  const advisorOpts: Opt[] = (
    (teachers ?? []) as { profile_id: string; full_name: string | null }[]
  ).map((t) => ({ value: t.profile_id, label: t.full_name ?? "(sans nom)" }));

  const badge = INTERNSHIP_STATUS[stage.status as InternshipStatus];

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link href="/espace/stages" className="text-sm text-black/50 hover:text-ipmd-black">
            ← Tous les stages
          </Link>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">
                {stage.student_name ?? "—"}
              </h1>
              <p className="mt-0.5 text-sm text-black/60">{stage.title ?? "—"}</p>
            </div>
            <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${badge?.cls ?? ""}`}>
              {badge?.label ?? stage.status}
            </span>
          </div>

          {/* Détail */}
          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Année académique">{stage.academic_year ?? "—"}</Field>
              <Field label="Statut">{badge?.label ?? stage.status}</Field>
              <Field label="Entreprise d'accueil">
                {stage.host_companies?.name ?? "—"}
                {stage.host_companies?.city ? ` · ${stage.host_companies.city}` : ""}
                {stage.host_companies?.status === "archive" ? " (archivée)" : ""}
              </Field>
              <Field label="Module">
                {stage.modules?.name
                  ? `${stage.modules.name}${stage.modules.level ? ` (${stage.modules.level})` : ""}`
                  : "—"}
              </Field>
              <Field label="Période">
                {fmt(stage.start_date)} → {fmt(stage.end_date)}
              </Field>
              <Field label="Encadreur académique">{stage.academic_advisor_name ?? "— Non affecté —"}</Field>
            </dl>

            <div className="mt-4 border-t border-black/5 pt-4">
              <Field label="Mission">
                <span className="whitespace-pre-wrap">{stage.mission ?? "—"}</span>
              </Field>
            </div>

            <div className="mt-4 border-t border-black/5 pt-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-black/40">
                Maître de stage (entreprise)
              </dt>
              <dd className="mt-0.5 text-sm text-ipmd-black">
                {stage.supervisor_name || "—"}
                {stage.supervisor_function ? ` · ${stage.supervisor_function}` : ""}
                {(stage.supervisor_email || stage.supervisor_phone) && (
                  <span className="block text-xs text-black/50">
                    {[stage.supervisor_email, stage.supervisor_phone].filter(Boolean).join(" · ")}
                  </span>
                )}
              </dd>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="text-base font-bold text-ipmd-black">Actions</h2>
            <p className="mt-0.5 mb-3 text-xs text-black/50">
              Chaque action est gardée par la base (statut, éligibilité, concurrence).
            </p>
            <StageActions
              id={stage.id}
              status={stage.status}
              hostCompanyId={stage.host_company_id}
              startDate={stage.start_date}
              endDate={stage.end_date}
              advisorId={stage.academic_advisor_id}
              companies={companyOpts}
              advisors={advisorOpts}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
