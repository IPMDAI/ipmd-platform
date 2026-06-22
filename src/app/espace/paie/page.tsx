import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import { formatFCFA } from "@/lib/finance";
import { TeacherPayForm } from "@/components/espace/TeacherPayForm";
import { PayoutControl } from "@/components/espace/PayoutControl";
import { PAYOUT_STATUS_LABEL } from "@/lib/payout";

export const metadata: Metadata = {
  title: "Paie enseignants",
};

function minutes(t: string): number {
  const [h, m] = t.split(":");
  return Number(h) * 60 + Number(m);
}
function hoursOf(start: string, end: string): number {
  return Math.max(0, (minutes(end) - minutes(start)) / 60);
}

/** Période par défaut : le mois en cours. */
function defaultPeriod(): { from: string; to: string } {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const p = (n: number) => String(n).padStart(2, "0");
  const from = `${y}-${p(m + 1)}-01`;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return { from, to: `${y}-${p(m + 1)}-${p(last)}` };
}

export default async function PaiePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const def = defaultPeriod();
  const from = sp.from || def.from;
  const to = sp.to || def.to;

  const { supabase } = await requireAdmin();

  const [{ data: teachers }, { data: pays }, { data: sheets }, { data: sessions }, { data: payouts }] =
    await Promise.all([
      supabase.from("profiles").select("id, full_name, email").eq("role", "enseignant").order("full_name"),
      supabase.from("teacher_pay").select("teacher_id, pay_type, hourly_rate, project_fee"),
      supabase.from("teacher_profiles").select("teacher_id, function"),
      supabase
        .from("course_sessions")
        .select("id, teacher_id, start_time, end_time, status")
        .gte("session_date", from)
        .lte("session_date", to),
      supabase
        .from("teacher_payouts")
        .select("teacher_id, status")
        .eq("period_start", from)
        .eq("period_end", to),
    ]);
  const payoutStatus = new Map((payouts ?? []).map((p) => [p.teacher_id, p.status]));

  // Fiches validées pour ces séances.
  const sessIds = (sessions ?? []).map((s) => s.id);
  const validatedRep = new Map<string, { start: string | null; end: string | null }>();
  if (sessIds.length > 0) {
    const { data: reps } = await supabase
      .from("session_reports")
      .select("session_id, actual_start, actual_end, validated")
      .in("session_id", sessIds)
      .eq("validated", true);
    for (const r of reps ?? [])
      validatedRep.set(r.session_id, { start: r.actual_start, end: r.actual_end });
  }

  const pay = new Map(
    (pays ?? []).map((p) => [p.teacher_id, { type: p.pay_type as string, hourly: Number(p.hourly_rate), fee: Number(p.project_fee) }])
  );
  const fnMap = new Map((sheets ?? []).map((s) => [s.teacher_id, s.function]));

  // Heures planifiées + validées par enseignant.
  const planned = new Map<string, number>();
  const validated = new Map<string, number>();
  for (const s of sessions ?? []) {
    if (!s.teacher_id) continue;
    if (s.status !== "ferie" && s.status !== "annulee") {
      planned.set(s.teacher_id, (planned.get(s.teacher_id) ?? 0) + hoursOf(s.start_time, s.end_time));
    }
    const rep = validatedRep.get(s.id);
    if (rep) {
      const h =
        rep.start && rep.end
          ? hoursOf(rep.start, rep.end)
          : hoursOf(s.start_time, s.end_time);
      validated.set(s.teacher_id, (validated.get(s.teacher_id) ?? 0) + h);
    }
  }

  const rows = (teachers ?? []).map((t) => {
    const cfg = pay.get(t.id) ?? { type: "horaire", hourly: 0, fee: 0 };
    const vH = validated.get(t.id) ?? 0;
    const montant = cfg.type === "projet" ? cfg.fee : vH * cfg.hourly;
    return {
      ...t,
      fn: fnMap.get(t.id),
      planned: planned.get(t.id) ?? 0,
      validated: vH,
      cfg,
      montant,
    };
  });
  const total = rows.reduce((a, r) => a + r.montant, 0);

  const fmtH = (h: number) => `${h.toFixed(1).replace(".0", "")} h`;

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link href="/espace" className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red">
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Paie enseignants
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Calculée sur les <strong>heures validées</strong> (fiches validées
            par la Pédagogie), pas seulement le planning prévu.
          </p>

          {/* Période */}
          <form className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <Field label="Du" htmlFor="from">
              <input id="from" name="from" type="date" defaultValue={from} className={inputBase} />
            </Field>
            <Field label="Au" htmlFor="to">
              <input id="to" name="to" type="date" defaultValue={to} className={inputBase} />
            </Field>
            <ActionButton type="submit">Calculer</ActionButton>
          </form>

          {/* Total */}
          <div className="mt-6 flex items-center justify-between rounded-2xl bg-ipmd-black px-5 py-4 text-white">
            <span className="text-sm font-semibold uppercase tracking-wide text-white/60">
              Total à payer (période)
            </span>
            <span className="text-2xl font-extrabold">{formatFCFA(total)}</span>
          </div>

          {rows.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucun enseignant.
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
              {rows.map((r) => (
                <li key={r.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-ipmd-black">{r.full_name || r.email}</p>
                      {r.fn && <p className="text-xs font-medium text-ipmd-red">{r.fn}</p>}
                    </div>
                    <span className="rounded-full bg-ipmd-red/10 px-3 py-1 text-sm font-bold text-ipmd-red">
                      {formatFCFA(r.montant)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold">
                    <span className="rounded-full bg-ipmd-light px-2.5 py-1 text-black/60">
                      Planifié : {fmtH(r.planned)}
                    </span>
                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-700">
                      Validé : {fmtH(r.validated)}
                    </span>
                    <span className="rounded-full bg-ipmd-light px-2.5 py-1 text-black/60">
                      {r.cfg.type === "projet"
                        ? `Forfait ${formatFCFA(r.cfg.fee)}`
                        : `${formatFCFA(r.cfg.hourly)}/h`}
                    </span>
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-semibold text-ipmd-red">
                      Modifier le taux / type
                    </summary>
                    <TeacherPayForm
                      teacherId={r.id}
                      payType={r.cfg.type}
                      hourlyRate={r.cfg.hourly}
                      projectFee={r.cfg.fee}
                    />
                  </details>

                  {(() => {
                    const st = payoutStatus.get(r.id) ?? "en_attente";
                    return (
                      <div className="mt-2 border-t border-black/5 pt-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            st === "paye"
                              ? "bg-green-50 text-green-700"
                              : st === "valide"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {PAYOUT_STATUS_LABEL[st] ?? st}
                        </span>
                        <PayoutControl
                          teacherId={r.id}
                          periodStart={from}
                          periodEnd={to}
                          hours={r.validated}
                          amount={r.montant}
                          current={st}
                        />
                      </div>
                    );
                  })()}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}
