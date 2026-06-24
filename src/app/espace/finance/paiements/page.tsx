import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { PrintButton } from "@/components/espace/PrintButton";
import { FinanceExportButton } from "@/components/espace/FinanceExportButton";
import { PaymentStatusSelect } from "@/components/espace/PaymentStatusSelect";
import {
  formatFCFA,
  computeFinance,
  KIND_LABEL,
  PAYMENT_METHODS,
  PAYMENT_KINDS,
  PAYMENT_STATUS,
} from "@/lib/finance";
import { CLASS_TYPE_LABEL } from "@/lib/academic";

export const metadata: Metadata = { title: "Paiements reçus" };

const STAFF = ["admin", "super_admin", "scolarite"];

function frDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00Z").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function PaiementsPage({
  searchParams,
}: {
  searchParams: Promise<{
    intake?: string;
    class?: string;
    student?: string;
    method?: string;
    kind?: string;
    status?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const sp = await searchParams;

  const { supabase, userId } = await requireUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (!STAFF.includes(me?.role ?? "")) redirect("/espace");

  const [
    { data: students },
    { data: finances },
    { data: payments },
    { data: members },
    { data: classRows },
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email").eq("role", "etudiant"),
    supabase.from("student_finance").select("student_id, registration_fee, tuition_due, discount_rate"),
    supabase
      .from("payments")
      .select("id, student_id, amount, method, kind, reference, paid_at, status, created_at")
      .order("paid_at", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("class_members").select("student_id, class_id"),
    supabase.from("classes").select("id, name, intake, class_type"),
  ]);

  const nameOf = new Map((students ?? []).map((s) => [s.id, s.full_name || s.email || "—"]));
  const dueOf = new Map(
    (finances ?? []).map((f) => [f.student_id, computeFinance(f, []).totalDue])
  );
  const classOf = new Map((members ?? []).map((m) => [m.student_id, m.class_id]));
  const classInfo = new Map(
    (classRows ?? []).map((c) => [c.id, { name: c.name, intake: c.intake, type: c.class_type }])
  );

  const all = payments ?? [];

  // Numéro de paiement séquentiel (ordre chronologique global).
  const numberOf = new Map(all.map((p, i) => [p.id, `P-${String(i + 1).padStart(4, "0")}`]));

  // Allocation par étudiant : montant utilisé vs reste/trop-perçu (paiements « payé » seulement).
  const usedOf = new Map<string, number>();
  const overOf = new Map<string, number>();
  const byStudent = new Map<string, typeof all>();
  for (const p of all) {
    const arr = byStudent.get(p.student_id) ?? [];
    arr.push(p);
    byStudent.set(p.student_id, arr);
  }
  for (const [sid, ps] of byStudent) {
    let remaining = dueOf.get(sid) ?? 0;
    for (const p of ps) {
      if (p.status && p.status !== "paye") {
        usedOf.set(p.id, 0);
        overOf.set(p.id, 0);
        continue;
      }
      const amt = Number(p.amount);
      const used = Math.min(amt, Math.max(0, remaining));
      usedOf.set(p.id, used);
      overOf.set(p.id, amt - used);
      remaining -= used;
    }
  }

  type Row = {
    id: string;
    no: string;
    date: string;
    studentId: string;
    name: string;
    className: string;
    intake: string;
    classType: string | null;
    typeLabel: string;
    kind: string;
    method: string;
    reference: string;
    amount: number;
    used: number;
    over: number;
    status: string;
  };

  const rows: Row[] = all.map((p) => {
    const cid = classOf.get(p.student_id) ?? null;
    const ci = cid ? classInfo.get(cid) : null;
    return {
      id: p.id,
      no: numberOf.get(p.id) ?? "—",
      date: p.paid_at,
      studentId: p.student_id,
      name: nameOf.get(p.student_id) ?? "—",
      className: ci?.name ?? "—",
      intake: ci?.intake ?? "—",
      classType: ci?.type ?? null,
      typeLabel: ci?.type ? CLASS_TYPE_LABEL[ci.type] ?? ci.type : "—",
      kind: p.kind ?? "scolarite",
      method: p.method ?? "—",
      reference: p.reference ?? "",
      amount: Number(p.amount),
      used: usedOf.get(p.id) ?? 0,
      over: overOf.get(p.id) ?? 0,
      status: p.status ?? "paye",
    };
  });

  // Options de filtres.
  const intakes = [...new Set(rows.map((r) => r.intake).filter((x) => x && x !== "—"))].sort();
  const classOptions = [...new Set(rows.filter((r) => r.className !== "—").map((r) => `${classOf.get(r.studentId)}|${r.className}`))];
  const studentOptions = [...new Map(rows.map((r) => [r.studentId, r.name])).entries()].sort((a, b) =>
    a[1].localeCompare(b[1])
  );

  // Application des filtres.
  let shown = rows;
  if (sp.intake) shown = shown.filter((r) => r.intake === sp.intake);
  if (sp.class) shown = shown.filter((r) => classOf.get(r.studentId) === sp.class);
  if (sp.student) shown = shown.filter((r) => r.studentId === sp.student);
  if (sp.method) shown = shown.filter((r) => r.method === sp.method);
  if (sp.kind) shown = shown.filter((r) => r.kind === sp.kind);
  if (sp.status) shown = shown.filter((r) => r.status === sp.status);
  if (sp.from) shown = shown.filter((r) => r.date >= sp.from!);
  if (sp.to) shown = shown.filter((r) => r.date <= sp.to!);

  // Journal : du plus récent au plus ancien.
  shown = [...shown].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const totalPaye = shown.filter((r) => r.status === "paye").reduce((a, r) => a + r.amount, 0);
  const nbAttente = shown.filter((r) => r.status === "en_attente").length;
  const nbAnnule = shown.filter((r) => r.status === "annule").length;
  const totalOver = shown.filter((r) => r.status === "paye").reduce((a, r) => a + r.over, 0);

  const exportColumns = [
    "Date", "N°", "Étudiant", "Classe", "Rentrée", "Type", "Type de frais",
    "Mode", "Référence", "Montant payé", "Montant utilisé", "Reste/Trop-perçu", "Statut",
  ];
  const exportRows = shown.map((r) => ({
    "Date": frDate(r.date),
    "N°": r.no,
    "Étudiant": r.name,
    "Classe": r.className,
    "Rentrée": r.intake,
    "Type": r.typeLabel,
    "Type de frais": KIND_LABEL[r.kind] ?? r.kind,
    "Mode": r.method,
    "Référence": r.reference,
    "Montant payé": r.amount,
    "Montant utilisé": r.used,
    "Reste/Trop-perçu": r.over,
    "Statut": PAYMENT_STATUS[r.status]?.label ?? r.status,
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
            <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">Paiements reçus</h1>
            <div className="flex flex-wrap gap-2 print:hidden">
              <PrintButton />
              <FinanceExportButton rows={exportRows} columns={exportColumns} filename="journal-paiements.csv" />
            </div>
          </div>

          {/* Onglets de vue */}
          <div className="mt-5 inline-flex rounded-full bg-white p-1 shadow-sm ring-1 ring-black/5 print:hidden">
            <Link
              href="/espace/finance"
              className="rounded-full px-4 py-1.5 text-sm font-semibold text-black/55 hover:text-ipmd-red"
            >
              Situation étudiants
            </Link>
            <span className="rounded-full bg-ipmd-red px-4 py-1.5 text-sm font-semibold text-white">
              Paiements reçus
            </span>
          </div>

          {/* Filtres */}
          <form className="mt-4 flex flex-wrap items-center gap-2 print:hidden">
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
            <select name="student" defaultValue={sp.student ?? ""} className={filterSelect}>
              <option value="">Tous les étudiants</option>
              {studentOptions.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
            <select name="method" defaultValue={sp.method ?? ""} className={filterSelect}>
              <option value="">Tous les modes</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select name="kind" defaultValue={sp.kind ?? ""} className={filterSelect}>
              <option value="">Tous les frais</option>
              {PAYMENT_KINDS.map((k) => (
                <option key={k.value} value={k.value}>{KIND_LABEL[k.value]}</option>
              ))}
            </select>
            <select name="status" defaultValue={sp.status ?? ""} className={filterSelect}>
              <option value="">Tous les statuts</option>
              {Object.entries(PAYMENT_STATUS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-xs text-black/50">
              du <input type="date" name="from" defaultValue={sp.from ?? ""} className="rounded-full border border-black/10 bg-white px-2 py-1.5 text-sm" />
            </label>
            <label className="flex items-center gap-1 text-xs text-black/50">
              au <input type="date" name="to" defaultValue={sp.to ?? ""} className="rounded-full border border-black/10 bg-white px-2 py-1.5 text-sm" />
            </label>
            <button type="submit" className="rounded-full bg-ipmd-red px-4 py-1.5 text-sm font-semibold text-white">
              Appliquer
            </button>
            <Link href="/espace/finance/paiements" className="text-sm font-semibold text-ipmd-red hover:underline">
              Réinitialiser
            </Link>
          </form>

          {/* Récap */}
          <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {stat("Paiements (vue)", String(shown.length))}
            {stat("Total payé", formatFCFA(totalPaye), "text-green-600")}
            {stat("Trop-perçu (avances)", formatFCFA(totalOver), "text-emerald-600")}
            {stat("En attente", String(nbAttente), "text-amber-600")}
            {stat("Annulés", String(nbAnnule), "text-ipmd-red")}
          </div>

          {/* Journal */}
          <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <table className="w-full min-w-[1280px] text-[12px]">
              <thead>
                <tr className="border-b border-black/10 bg-ipmd-light text-left text-[10px] uppercase tracking-wider text-black/45">
                  <th className="px-3 py-2 font-semibold">Date</th>
                  <th className="px-3 py-2 font-semibold">N°</th>
                  <th className="px-3 py-2 font-semibold">Étudiant</th>
                  <th className="px-3 py-2 font-semibold">Classe</th>
                  <th className="px-3 py-2 font-semibold">Rentrée</th>
                  <th className="px-3 py-2 font-semibold">Type</th>
                  <th className="px-3 py-2 font-semibold">Frais</th>
                  <th className="px-3 py-2 font-semibold">Mode</th>
                  <th className="px-3 py-2 font-semibold">Référence</th>
                  <th className="px-3 py-2 text-right font-semibold">Montant payé</th>
                  <th className="px-3 py-2 text-right font-semibold">Utilisé</th>
                  <th className="px-3 py-2 text-right font-semibold">Reste / Trop-perçu</th>
                  <th className="px-3 py-2 font-semibold">Reçu</th>
                  <th className="px-3 py-2 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 ? (
                  <tr><td colSpan={14} className="px-3 py-6 text-center text-black/45">Aucun paiement dans cette sélection.</td></tr>
                ) : (
                  shown.map((r) => (
                    <tr key={r.id} className="border-t border-black/5 hover:bg-ipmd-light/40">
                      <td className="px-3 py-2 text-black/60">{frDate(r.date)}</td>
                      <td className="px-3 py-2 font-mono text-black/55">{r.no}</td>
                      <td className="px-3 py-2 font-medium text-ipmd-black">
                        <Link href={`/espace/finance/${r.studentId}`} className="hover:text-ipmd-red">{r.name}</Link>
                      </td>
                      <td className="px-3 py-2 text-black/60">{r.className}</td>
                      <td className="px-3 py-2 text-black/60">{r.intake}</td>
                      <td className="px-3 py-2 text-black/60">{r.typeLabel}</td>
                      <td className="px-3 py-2 text-black/60">{KIND_LABEL[r.kind] ?? r.kind}</td>
                      <td className="px-3 py-2 text-black/60">{r.method}</td>
                      <td className="px-3 py-2 text-black/50">{r.reference || "—"}</td>
                      <td className="px-3 py-2 text-right font-semibold text-ipmd-black">{formatFCFA(r.amount)}</td>
                      <td className="px-3 py-2 text-right text-green-700">{r.status === "paye" ? formatFCFA(r.used) : "—"}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${r.over > 0 ? "text-emerald-600" : "text-black/30"}`}>
                        {r.status === "paye" && r.over > 0 ? `+${formatFCFA(r.over)}` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <Link href={`/espace/recu/${r.id}`} className="font-semibold text-ipmd-red hover:underline">
                          Reçu ↗
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <PaymentStatusSelect paymentId={r.id} status={r.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-black/40">
            {shown.length} paiement(s) · Journal des versements · « Montant utilisé » = part imputée au dû ;
            le surplus apparaît en « Trop-perçu ». IPMD — scolarite@ipmd.pro
          </p>
        </div>
      </Container>
    </section>
  );
}
