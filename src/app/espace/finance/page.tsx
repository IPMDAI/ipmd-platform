import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { PrintButton } from "@/components/espace/PrintButton";
import { FinanceExportButton } from "@/components/espace/FinanceExportButton";
import {
  formatFCFA,
  computeFinance,
  computeSchedule,
  FINANCIAL_STATUS,
} from "@/lib/finance";

export const metadata: Metadata = { title: "Finance" };

const STAFF = ["admin", "super_admin", "scolarite"];

const FILTERS = [
  { key: "tous", label: "Tous" },
  { key: "non_a_jour", label: "Non à jour" },
  { key: "a_jour", label: "À jour" },
  { key: "insc_non_soldee", label: "Inscription non soldée" },
  { key: "solde", label: "Soldés" },
];

const CAT_STATUS: Record<string, string> = {
  solde: "solde",
  insc_non_soldee: "inscription_non_soldee",
  non_a_jour: "non_a_jour",
  a_jour: "a_jour",
};

function frDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const active = FILTERS.some((f) => f.key === filter) ? filter! : "tous";

  const { supabase, userId } = await requireUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (!STAFF.includes(me?.role ?? "")) redirect("/espace");

  const [{ data: students }, { data: finances }, { data: payments }, { data: schedules }] =
    await Promise.all([
      supabase.from("profiles").select("id, full_name, email").eq("role", "etudiant").order("full_name"),
      supabase
        .from("student_finance")
        .select("student_id, registration_fee, tuition_due, discount_rate, level, status, access_state"),
      supabase.from("payments").select("student_id, amount, method, kind"),
      supabase.from("payment_schedules").select("student_id, amount, due_date"),
    ]);

  const finMap = new Map((finances ?? []).map((f) => [f.student_id, f]));
  const payByStudent = new Map<string, { amount: number; kind: string | null }[]>();
  for (const p of payments ?? []) {
    const arr = payByStudent.get(p.student_id) ?? [];
    arr.push({ amount: Number(p.amount), kind: p.kind });
    payByStudent.set(p.student_id, arr);
  }
  const schedByStudent = new Map<string, { amount: number; due_date: string }[]>();
  for (const s of schedules ?? []) {
    const arr = schedByStudent.get(s.student_id) ?? [];
    arr.push({ amount: Number(s.amount), due_date: s.due_date });
    schedByStudent.set(s.student_id, arr);
  }

  const today = new Date().toISOString().slice(0, 10);

  type Row = {
    id: string;
    name: string;
    level: string;
    due: number;
    paid: number;
    balance: number;
    category: string;
    statusLabel: string;
    statusCls: string;
    nextDue: string;
  };

  const rows: Row[] = (students ?? []).map((s) => {
    const f = finMap.get(s.id) ?? null;
    const fin = computeFinance(f, payByStudent.get(s.id) ?? []);
    const sched = computeSchedule(
      (schedByStudent.get(s.id) ?? []).map((x, i) => ({ id: String(i), label: null, ...x })),
      fin.totalPaid,
      today
    );
    const overdue = sched.rows.filter((r) => r.status === "retard");
    const isSolde = fin.totalDue > 0 && fin.balance <= 0;
    const inscNonSoldee = fin.registrationFee > 0 && !fin.registrationSettled;
    const isOverdue = !isSolde && overdue.length > 0;
    const category = isSolde
      ? "solde"
      : inscNonSoldee
        ? "insc_non_soldee"
        : isOverdue
          ? "non_a_jour"
          : "a_jour";
    const statusKey = f?.status || CAT_STATUS[category];
    const info = FINANCIAL_STATUS[statusKey] ?? { label: statusKey, cls: "bg-black/5 text-black/60" };
    return {
      id: s.id,
      name: s.full_name || s.email || "—",
      level: f?.level ?? "",
      due: fin.totalDue,
      paid: fin.totalPaid,
      balance: fin.balance,
      category,
      statusLabel: info.label,
      statusCls: info.cls,
      nextDue: sched.next ? frDate(sched.next.due_date) : "—",
    };
  });

  // KPIs
  const totalDue = rows.reduce((a, r) => a + r.due, 0);
  const totalPaid = rows.reduce((a, r) => a + r.paid, 0);
  const remaining = Math.max(0, totalDue - totalPaid);
  const counts = {
    solde: rows.filter((r) => r.category === "solde").length,
    non_a_jour: rows.filter((r) => r.category === "non_a_jour").length,
    a_jour: rows.filter((r) => r.category === "a_jour").length,
    insc_non_soldee: rows.filter((r) => r.category === "insc_non_soldee").length,
  };

  // Encaissements par mode
  const byMethod = new Map<string, number>();
  for (const p of payments ?? []) {
    const k = p.method || "Autre";
    byMethod.set(k, (byMethod.get(k) ?? 0) + Number(p.amount));
  }
  const methods = [...byMethod.entries()].sort((a, b) => b[1] - a[1]);

  const shown = active === "tous" ? rows : rows.filter((r) => r.category === active);

  const kpi = (label: string, value: string, cls = "text-ipmd-black") => (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-black/40">{label}</p>
      <p className={`mt-1 text-xl font-extrabold ${cls}`}>{value}</p>
    </div>
  );

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <Link href="/espace" className="text-sm font-semibold text-black/50 hover:text-ipmd-red print:hidden">
            ← Retour à l&apos;espace
          </Link>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">Finance</h1>
            <div className="flex flex-wrap gap-2 print:hidden">
              <PrintButton />
              <FinanceExportButton
                rows={shown.map((r) => ({
                  name: r.name,
                  level: r.level,
                  due: r.due,
                  paid: r.paid,
                  balance: r.balance,
                  status: r.statusLabel,
                  nextDue: r.nextDue,
                }))}
                filename={`finance-${active}.csv`}
              />
              <Link
                href="/espace/finance/parametres"
                className="inline-flex items-center gap-2 rounded-full bg-ipmd-light px-4 py-2 text-sm font-semibold text-ipmd-black ring-1 ring-black/10 transition-colors hover:ring-ipmd-red/40"
              >
                ⚙️ Paramètres
              </Link>
            </div>
          </div>

          {/* KPIs */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {kpi("Total attendu", formatFCFA(totalDue))}
            {kpi("Encaissé", formatFCFA(totalPaid), "text-green-600")}
            {kpi("Reste à encaisser", formatFCFA(remaining), "text-ipmd-red")}
            {kpi("Non à jour", String(counts.non_a_jour), "text-ipmd-red")}
            {kpi("Soldés", String(counts.solde), "text-green-600")}
          </div>

          {/* Encaissements par mode */}
          {methods.length > 0 && (
            <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-black/40">
                Encaissements par mode
              </p>
              <div className="flex flex-wrap gap-2">
                {methods.map(([m, v]) => (
                  <span key={m} className="rounded-full bg-ipmd-light px-3 py-1.5 text-xs font-semibold text-black/70">
                    {m} · <span className="text-ipmd-black">{formatFCFA(v)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Filtres (états) */}
          <div className="mt-6 flex flex-wrap gap-2 print:hidden">
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={`/espace/finance?filter=${f.key}`}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                  active === f.key
                    ? "bg-ipmd-red text-white"
                    : "bg-white text-black/60 ring-1 ring-black/10 hover:text-ipmd-red"
                }`}
              >
                {f.label}
                {f.key !== "tous" && f.key in counts
                  ? ` (${counts[f.key as keyof typeof counts]})`
                  : ""}
              </Link>
            ))}
          </div>

          {/* Tableau / état */}
          <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 bg-ipmd-light text-left text-xs uppercase tracking-wider text-black/45">
                  <th className="px-4 py-3 font-semibold">Étudiant</th>
                  <th className="px-4 py-3 font-semibold">Niveau</th>
                  <th className="px-4 py-3 text-right font-semibold">Dû</th>
                  <th className="px-4 py-3 text-right font-semibold">Payé</th>
                  <th className="px-4 py-3 text-right font-semibold">Reste</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 font-semibold">Prochaine</th>
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-black/45">
                      Aucun étudiant dans cet état.
                    </td>
                  </tr>
                ) : (
                  shown.map((r) => (
                    <tr key={r.id} className="border-t border-black/5 hover:bg-ipmd-light/50">
                      <td className="px-4 py-3 font-medium text-ipmd-black">
                        <Link href={`/espace/finance/${r.id}`} className="hover:text-ipmd-red">
                          {r.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-black/55">{r.level || "—"}</td>
                      <td className="px-4 py-3 text-right text-black/70">{formatFCFA(r.due)}</td>
                      <td className="px-4 py-3 text-right text-green-700">{formatFCFA(r.paid)}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${r.balance <= 0 ? "text-green-600" : "text-ipmd-red"}`}>
                        {r.balance <= 0 ? "—" : formatFCFA(r.balance)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${r.statusCls}`}>
                          {r.statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-black/55">{r.nextDue}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-black/40 print:block">
            État « {FILTERS.find((f) => f.key === active)?.label} » · {shown.length} étudiant(s) ·
            IPMD — scolarite@ipmd.pro
          </p>
        </div>
      </Container>
    </section>
  );
}
