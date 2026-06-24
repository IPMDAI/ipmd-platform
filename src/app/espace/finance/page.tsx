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
import { CLASS_TYPE_LABEL } from "@/lib/academic";

export const metadata: Metadata = { title: "Finance" };

const STAFF = ["admin", "super_admin", "scolarite"];

const STATUS_FILTERS = [
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

function frDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; intake?: string; class?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const activeStatus = STATUS_FILTERS.some((f) => f.key === sp.filter) ? sp.filter! : "tous";

  const { supabase, userId } = await requireUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (!STAFF.includes(me?.role ?? "")) redirect("/espace");

  const [
    { data: students },
    { data: finances },
    { data: payments },
    { data: schedules },
    { data: members },
    { data: classRows },
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, created_at").eq("role", "etudiant").order("full_name"),
    supabase
      .from("student_finance")
      .select("student_id, registration_fee, tuition_due, discount_rate, level, status, payer_note"),
    supabase.from("payments").select("student_id, amount, method, kind"),
    supabase.from("payment_schedules").select("student_id, amount, due_date"),
    supabase.from("class_members").select("student_id, class_id"),
    supabase.from("classes").select("id, name, intake, class_type"),
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
  const classOf = new Map((members ?? []).map((m) => [m.student_id, m.class_id]));
  const classInfo = new Map(
    (classRows ?? []).map((c) => [c.id, { name: c.name, intake: c.intake, type: c.class_type }])
  );

  const today = new Date().toISOString().slice(0, 10);

  type Row = {
    id: string;
    name: string;
    className: string;
    intake: string;
    typeLabel: string;
    classType: string | null;
    classId: string | null;
    enrolledAt: string | null;
    registrationFee: number;
    tuitionDue: number;
    discountRate: number;
    discountAmount: number;
    totalDue: number;
    paid: number;
    balance: number;
    nextDate: string | null;
    nextAmount: number;
    category: string;
    statusLabel: string;
    statusCls: string;
    hasSchedule: boolean;
    payerNote: string;
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
    const category = isSolde ? "solde" : inscNonSoldee ? "insc_non_soldee" : isOverdue ? "non_a_jour" : "a_jour";
    const statusKey = f?.status || CAT_STATUS[category];
    const info = FINANCIAL_STATUS[statusKey] ?? { label: statusKey, cls: "bg-black/5 text-black/60" };
    const cid = classOf.get(s.id) ?? null;
    const ci = cid ? classInfo.get(cid) : null;
    return {
      id: s.id,
      name: s.full_name || s.email || "—",
      className: ci?.name ?? "—",
      intake: ci?.intake ?? "—",
      classType: ci?.type ?? null,
      typeLabel: ci?.type ? CLASS_TYPE_LABEL[ci.type] ?? ci.type : "—",
      classId: cid,
      enrolledAt: s.created_at ?? null,
      registrationFee: fin.registrationFee,
      tuitionDue: fin.tuitionDue,
      discountRate: fin.discountRate,
      discountAmount: fin.tuitionDue - fin.tuitionNet,
      totalDue: fin.totalDue,
      paid: fin.totalPaid,
      balance: fin.balance,
      nextDate: sched.next ? sched.next.due_date : null,
      nextAmount: sched.next ? Number(sched.next.amount) : 0,
      category,
      statusLabel: info.label,
      statusCls: info.cls,
      hasSchedule: (schedByStudent.get(s.id) ?? []).length > 0,
      payerNote: f?.payer_note ?? "",
    };
  });

  // Options de filtres.
  const intakes = [...new Set(rows.map((r) => r.intake).filter((x) => x && x !== "—"))].sort();
  const classOptions = [...new Set(rows.filter((r) => r.classId).map((r) => `${r.classId}|${r.className}`))];
  const types = ["initial", "pro", "partenaire"];

  // Application des filtres.
  let shown = rows;
  if (sp.intake) shown = shown.filter((r) => r.intake === sp.intake);
  if (sp.class) shown = shown.filter((r) => r.classId === sp.class);
  if (sp.type) shown = shown.filter((r) => r.classType === sp.type);
  if (activeStatus !== "tous") shown = shown.filter((r) => r.category === activeStatus);

  // Récap (sur la sélection filtrée).
  const sum = (f: (r: Row) => number) => shown.reduce((a, r) => a + f(r), 0);
  const recap = {
    inscription: sum((r) => r.registrationFee),
    scolariteBrut: sum((r) => r.tuitionDue),
    reductions: sum((r) => r.discountAmount),
    duApres: sum((r) => r.totalDue),
    encaisse: sum((r) => r.paid),
    reste: sum((r) => Math.max(0, r.balance)),
    soldes: shown.filter((r) => r.category === "solde").length,
    nonSoldes: shown.filter((r) => r.category !== "solde").length,
    retard: shown.filter((r) => r.category === "non_a_jour").length,
    echeancier: shown.filter((r) => r.hasSchedule).length,
    prochaine: shown.filter((r) => r.category !== "solde").reduce((a, r) => a + r.nextAmount, 0),
  };

  const queryWith = (patch: Record<string, string>) => {
    const q = new URLSearchParams();
    if (sp.intake) q.set("intake", sp.intake);
    if (sp.class) q.set("class", sp.class);
    if (sp.type) q.set("type", sp.type);
    if (activeStatus !== "tous") q.set("filter", activeStatus);
    for (const [k, v] of Object.entries(patch)) {
      if (v) q.set(k, v);
      else q.delete(k);
    }
    const s = q.toString();
    return `/espace/finance${s ? `?${s}` : ""}`;
  };

  const exportColumns = [
    "Étudiant", "Classe", "Rentrée", "Type", "Date inscription", "Inscription",
    "Scolarité", "Réduction %", "Montant réduction", "Total dû", "Payé", "Reste",
    "Prochaine échéance", "Statut", "Profil payeur",
  ];
  const exportRows = shown.map((r) => ({
    "Étudiant": r.name,
    "Classe": r.className,
    "Rentrée": r.intake,
    "Type": r.typeLabel,
    "Date inscription": frDate(r.enrolledAt),
    "Inscription": r.registrationFee,
    "Scolarité": r.tuitionDue,
    "Réduction %": Math.round(r.discountRate * 100),
    "Montant réduction": r.discountAmount,
    "Total dû": r.totalDue,
    "Payé": r.paid,
    "Reste": Math.max(0, r.balance),
    "Prochaine échéance": r.nextDate ? `${frDate(r.nextDate)} (${r.nextAmount})` : "—",
    "Statut": r.statusLabel,
    "Profil payeur": r.payerNote,
  }));

  const stat = (label: string, value: string, cls = "text-ipmd-black") => (
    <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">{label}</p>
      <p className={`mt-0.5 text-base font-extrabold ${cls}`}>{value}</p>
    </div>
  );

  const filterSelect = "rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-ipmd-black";

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <Link href="/espace" className="text-sm font-semibold text-black/50 hover:text-ipmd-red print:hidden">
            ← Retour à l&apos;espace
          </Link>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">Finance</h1>
            <div className="flex flex-wrap gap-2 print:hidden">
              <PrintButton />
              <FinanceExportButton rows={exportRows} columns={exportColumns} filename={`finance-${sp.intake || sp.type || activeStatus}.csv`} />
              <Link href="/espace/finance/parametres" className="inline-flex items-center gap-2 rounded-full bg-ipmd-light px-4 py-2 text-sm font-semibold text-ipmd-black ring-1 ring-black/10 hover:ring-ipmd-red/40">
                ⚙️ Paramètres
              </Link>
            </div>
          </div>

          {/* Filtres cohorte (form GET) */}
          <form className="mt-5 flex flex-wrap items-center gap-2 print:hidden">
            {activeStatus !== "tous" && <input type="hidden" name="filter" value={activeStatus} />}
            <span className="text-xs font-semibold uppercase tracking-wider text-black/40">Filtrer :</span>
            <select name="intake" defaultValue={sp.intake ?? ""} className={filterSelect}>
              <option value="">Toutes les rentrées</option>
              {intakes.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
            <select name="class" defaultValue={sp.class ?? ""} className={filterSelect}>
              <option value="">Toutes les classes</option>
              {classOptions.map((co) => {
                const [id, name] = co.split("|");
                return <option key={id} value={id}>{name}</option>;
              })}
            </select>
            <select name="type" defaultValue={sp.type ?? ""} className={filterSelect}>
              <option value="">Tous les types</option>
              {types.map((t) => (
                <option key={t} value={t}>{CLASS_TYPE_LABEL[t]}</option>
              ))}
            </select>
            <button type="submit" className="rounded-full bg-ipmd-red px-4 py-1.5 text-sm font-semibold text-white">
              Appliquer
            </button>
            {(sp.intake || sp.class || sp.type) && (
              <Link href={queryWith({ intake: "", class: "", type: "" })} className="text-sm font-semibold text-ipmd-red hover:underline">
                Réinitialiser
              </Link>
            )}
          </form>

          {/* Récap détaillé (selon le filtre) */}
          <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {stat("Inscription attendue", formatFCFA(recap.inscription))}
            {stat("Scolarité attendue (brut)", formatFCFA(recap.scolariteBrut))}
            {stat("Réductions accordées", formatFCFA(recap.reductions), "text-amber-600")}
            {stat("Total dû (après réduction)", formatFCFA(recap.duApres))}
            {stat("Encaissé", formatFCFA(recap.encaisse), "text-green-600")}
            {stat("Reste à encaisser", formatFCFA(recap.reste), "text-ipmd-red")}
            {stat("Prochaine échéance (att.)", formatFCFA(recap.prochaine))}
            {stat("Soldés", String(recap.soldes), "text-green-600")}
            {stat("Non soldés", String(recap.nonSoldes))}
            {stat("En retard", String(recap.retard), "text-ipmd-red")}
            {stat("Avec échéancier", String(recap.echeancier))}
            {stat("Étudiants (vue)", String(shown.length))}
          </div>

          {/* Filtres statut */}
          <div className="mt-5 flex flex-wrap gap-2 print:hidden">
            {STATUS_FILTERS.map((f) => (
              <Link
                key={f.key}
                href={queryWith({ filter: f.key === "tous" ? "" : f.key })}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                  activeStatus === f.key ? "bg-ipmd-red text-white" : "bg-white text-black/60 ring-1 ring-black/10 hover:text-ipmd-red"
                }`}
              >
                {f.label}
              </Link>
            ))}
          </div>

          {/* Tableau détaillé */}
          <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <table className="w-full min-w-[1100px] text-[12px]">
              <thead>
                <tr className="border-b border-black/10 bg-ipmd-light text-left text-[10px] uppercase tracking-wider text-black/45">
                  <th className="px-3 py-2 font-semibold">Étudiant</th>
                  <th className="px-3 py-2 font-semibold">Classe</th>
                  <th className="px-3 py-2 font-semibold">Rentrée</th>
                  <th className="px-3 py-2 font-semibold">Type</th>
                  <th className="px-3 py-2 font-semibold">Date inscr.</th>
                  <th className="px-3 py-2 font-semibold">Inscription</th>
                  <th className="px-3 py-2 font-semibold">Scolarité</th>
                  <th className="px-3 py-2 font-semibold">Réduction</th>
                  <th className="px-3 py-2 text-right font-semibold">Total dû</th>
                  <th className="px-3 py-2 text-right font-semibold">Payé</th>
                  <th className="px-3 py-2 text-right font-semibold">Reste</th>
                  <th className="px-3 py-2 font-semibold">Prochaine éch.</th>
                  <th className="px-3 py-2 font-semibold">Statut</th>
                  <th className="px-3 py-2 font-semibold">Profil payeur</th>
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 ? (
                  <tr><td colSpan={14} className="px-3 py-6 text-center text-black/45">Aucun étudiant dans cette sélection.</td></tr>
                ) : (
                  shown.map((r) => (
                    <tr key={r.id} className="border-t border-black/5 hover:bg-ipmd-light/40">
                      <td className="px-3 py-2 font-medium text-ipmd-black">
                        <Link href={`/espace/finance/${r.id}`} className="hover:text-ipmd-red">{r.name}</Link>
                      </td>
                      <td className="px-3 py-2 text-black/60">{r.className}</td>
                      <td className="px-3 py-2 text-black/60">{r.intake}</td>
                      <td className="px-3 py-2 text-black/60">{r.typeLabel}</td>
                      <td className="px-3 py-2 text-black/50">{frDate(r.enrolledAt)}</td>
                      <td className="px-3 py-2 text-black/60">{formatFCFA(r.registrationFee)}</td>
                      <td className="px-3 py-2 text-black/60">{formatFCFA(r.tuitionDue)}</td>
                      <td className="px-3 py-2 text-amber-600">
                        {r.discountRate > 0 ? `−${Math.round(r.discountRate * 100)}% (${r.discountAmount.toLocaleString("fr-FR")})` : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-ipmd-black">{formatFCFA(r.totalDue)}</td>
                      <td className="px-3 py-2 text-right text-green-700">{formatFCFA(r.paid)}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${r.balance <= 0 ? "text-green-600" : "text-ipmd-red"}`}>
                        {r.balance <= 0 ? "—" : formatFCFA(r.balance)}
                      </td>
                      <td className="px-3 py-2 text-black/55">
                        {r.nextDate ? `${frDate(r.nextDate)} · ${r.nextAmount.toLocaleString("fr-FR")}` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.statusCls}`}>{r.statusLabel}</span>
                      </td>
                      <td className="px-3 py-2 text-black/55">{r.payerNote || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-black/40">
            {shown.length} étudiant(s) ·
            {sp.intake ? ` Rentrée ${sp.intake} ·` : ""}
            {sp.type ? ` ${CLASS_TYPE_LABEL[sp.type]} ·` : ""}
            {" "}La réduction s&apos;applique uniquement sur la scolarité. IPMD — scolarite@ipmd.pro
          </p>
        </div>
      </Container>
    </section>
  );
}
