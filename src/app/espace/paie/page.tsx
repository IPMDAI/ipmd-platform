import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { formatFCFA } from "@/lib/finance";
import { TeacherPayForm } from "@/components/espace/TeacherPayForm";

export const metadata: Metadata = {
  title: "Paie enseignants",
};

function minutes(t: string): number {
  const [h, m] = t.split(":");
  return Number(h) * 60 + Number(m);
}

export default async function PaiePage() {
  const { supabase } = await requireAdmin();

  const [{ data: teachers }, { data: slots }, { data: pays }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "enseignant")
        .order("full_name"),
      supabase.from("timetable_slots").select("teacher_id, start_time, end_time"),
      supabase
        .from("teacher_pay")
        .select("teacher_id, pay_type, hourly_rate, project_fee"),
    ]);

  // Heures hebdomadaires par enseignant.
  const hours = new Map<string, number>();
  for (const s of slots ?? []) {
    if (!s.teacher_id) continue;
    const h = (minutes(s.end_time) - minutes(s.start_time)) / 60;
    hours.set(s.teacher_id, (hours.get(s.teacher_id) ?? 0) + h);
  }
  const pay = new Map(
    (pays ?? []).map((p) => [
      p.teacher_id,
      {
        type: p.pay_type as string,
        hourly: Number(p.hourly_rate),
        fee: Number(p.project_fee),
      },
    ])
  );

  const rows = (teachers ?? []).map((t) => {
    const wHours = hours.get(t.id) ?? 0;
    const cfg = pay.get(t.id) ?? { type: "horaire", hourly: 0, fee: 0 };
    const weekly = cfg.type === "horaire" ? wHours * cfg.hourly : 0;
    const forfait = cfg.type === "projet" ? cfg.fee : 0;
    return { ...t, wHours, cfg, weekly, forfait };
  });

  const totalWeekly = rows.reduce((a, r) => a + r.weekly, 0);
  const totalForfait = rows.reduce((a, r) => a + r.forfait, 0);

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
            Paie enseignants
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Taux modifiable par enseignant, ou forfait projet. Heures calculées
            depuis le planning.
          </p>

          {/* Totaux */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-ipmd-black px-5 py-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                Coût horaire / semaine
              </p>
              <p className="mt-1 text-2xl font-extrabold">
                {formatFCFA(totalWeekly)}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase tracking-wide text-black/40">
                Forfaits projet
              </p>
              <p className="mt-1 text-2xl font-extrabold text-ipmd-black">
                {formatFCFA(totalForfait)}
              </p>
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucun enseignant.
            </p>
          ) : (
            <ul className="mt-8 space-y-4">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-ipmd-black">
                        {r.full_name || r.email}
                      </p>
                      <p className="text-xs text-black/50">
                        {r.wHours.toFixed(1).replace(".0", "")} h / semaine au
                        planning
                      </p>
                    </div>
                    <span className="rounded-full bg-ipmd-red/10 px-3 py-1 text-sm font-bold text-ipmd-red">
                      {r.cfg.type === "projet"
                        ? `${formatFCFA(r.forfait)} (forfait)`
                        : `${formatFCFA(r.weekly)} / sem.`}
                    </span>
                  </div>
                  <TeacherPayForm
                    teacherId={r.id}
                    payType={r.cfg.type}
                    hourlyRate={r.cfg.hourly}
                    projectFee={r.cfg.fee}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}
