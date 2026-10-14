import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAcademic } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { DefenseScheduling } from "@/components/espace/defenses/DefenseScheduling";
import { JuryManager, type JuryMember } from "@/components/espace/defenses/JuryManager";
import { EvaluationPanel, type EvalMember } from "@/components/espace/defenses/EvaluationPanel";
import { ResultPanel, type Result } from "@/components/espace/defenses/ResultPanel";
import type { Opt } from "@/components/espace/defenses/DefenseCreateForm";
import { DEFENSE_STATUS, attemptLabel, type DefenseStatus } from "@/lib/defenses";
import { WORK_TYPE_LABEL } from "@/lib/academic-works";

export const metadata: Metadata = { title: "Soutenance" };

function fmt(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

type Defense = {
  id: string;
  student_name: string | null;
  work_title: string | null;
  academic_year: string | null;
  attempt: number;
  scheduled_at: string | null;
  room_id: string | null;
  room_name: string | null;
  status: string;
  academic_works: { work_type: string | null } | null;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-black/40">{label}</dt>
      <dd className="mt-0.5 text-sm text-ipmd-black">{children}</dd>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="text-base font-bold text-ipmd-black">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default async function SoutenanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAcademic();

  const { data } = await supabase
    .from("defenses")
    .select("id, student_name, work_title, academic_year, attempt, scheduled_at, room_id, room_name, status, academic_works(work_type)")
    .eq("id", id)
    .single();
  const def = data as unknown as Defense | null;
  if (!def) notFound();

  const [membersRes, evalsRes, resultRes, roomsRes, eligRes] = await Promise.all([
    supabase.from("jury_members")
      .select("id, member_type, profile_name, external_name, external_function, external_organization, role")
      .eq("defense_id", id).is("removed_at", null).order("created_at"),
    supabase.from("jury_evaluations").select("jury_member_id, eval_status, score").eq("defense_id", id),
    supabase.from("defense_results").select("final_score, mention, jury_decision, deliberation, result_status").eq("defense_id", id).maybeSingle(),
    supabase.from("rooms").select("id, name").order("name"),
    supabase.rpc("jury_eligible_internals"),
  ]);

  const members = (membersRes.data ?? []) as JuryMember[];
  const evalMap = new Map<string, { eval_status: string | null; score: number | null }>();
  for (const e of evalsRes.data ?? []) evalMap.set(e.jury_member_id, { eval_status: e.eval_status, score: e.score });
  const result = (resultRes.data ?? null) as Result;
  const rooms: Opt[] = (roomsRes.data ?? []).map((r) => ({ value: r.id, label: r.name }));
  const eligible: Opt[] = ((eligRes.data ?? []) as { profile_id: string; full_name: string | null }[])
    .map((t) => ({ value: t.profile_id, label: t.full_name ?? "(sans nom)" }));

  const evalMembers: EvalMember[] = members.map((m) => {
    const ev = evalMap.get(m.id);
    return {
      id: m.id,
      name: m.member_type === "interne" ? m.profile_name ?? "—" : m.external_name ?? "—",
      member_type: m.member_type,
      eval_status: ev?.eval_status ?? null,
      score: ev?.score ?? null,
    };
  });

  const badge = DEFENSE_STATUS[def.status as DefenseStatus];
  const juryEditable = def.status === "a_planifier" || def.status === "planifiee";
  const evalEditable = def.status === "tenue" && (!result || result.result_status === "en_evaluation");

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link href="/espace/soutenances" className="text-sm text-black/50 hover:text-ipmd-black">← Toutes les soutenances</Link>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">{def.student_name ?? "—"}</h1>
              <p className="mt-0.5 text-sm text-black/60">{def.work_title ?? "—"}</p>
            </div>
            <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${badge?.cls ?? ""}`}>{badge?.label ?? def.status}</span>
          </div>

          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Travail">{WORK_TYPE_LABEL[def.academic_works?.work_type ?? ""] ?? "—"}</Field>
              <Field label="Tentative">{attemptLabel(def.attempt)}</Field>
              <Field label="Année">{def.academic_year ?? "—"}</Field>
              <Field label="Statut">{badge?.label ?? def.status}</Field>
              <Field label="Date & heure">{fmt(def.scheduled_at)}</Field>
              <Field label="Salle">{def.room_name ?? "— Non définie —"}</Field>
            </dl>
          </div>

          <Card title="Planification">
            <DefenseScheduling id={def.id} status={def.status} scheduledAt={def.scheduled_at} roomId={def.room_id} rooms={rooms} />
          </Card>

          <Card title="Jury">
            <JuryManager defenseId={def.id} members={members} eligibleInternals={eligible} editable={juryEditable} />
          </Card>

          <Card title="Évaluations">
            {def.status !== "tenue" ? (
              <p className="text-sm text-black/55">Les évaluations se saisissent une fois la soutenance « tenue ».</p>
            ) : (
              <EvaluationPanel defenseId={def.id} members={evalMembers} editable={evalEditable} />
            )}
          </Card>

          <Card title="Résultat & délibération">
            <ResultPanel defenseId={def.id} status={def.status} result={result} />
          </Card>
        </div>
      </Container>
    </section>
  );
}
