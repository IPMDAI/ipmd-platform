import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { formatFCFA } from "@/lib/finance";

export const metadata: Metadata = {
  title: "Finance",
};

export default async function FinancePage() {
  const { supabase } = await requireAdmin();

  const [{ data: students }, { data: finances }, { data: payments }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "etudiant")
        .order("full_name"),
      supabase.from("student_finance").select("student_id, total_due"),
      supabase.from("payments").select("student_id, amount"),
    ]);

  const dueMap = new Map(
    (finances ?? []).map((f) => [f.student_id, Number(f.total_due)])
  );
  const paidMap = new Map<string, number>();
  for (const p of payments ?? []) {
    paidMap.set(
      p.student_id,
      (paidMap.get(p.student_id) ?? 0) + Number(p.amount)
    );
  }

  const rows = (students ?? []).map((s) => {
    const due = dueMap.get(s.id) ?? 0;
    const paid = paidMap.get(s.id) ?? 0;
    return { ...s, due, paid, balance: due - paid };
  });

  const totalCollected = [...paidMap.values()].reduce((a, b) => a + b, 0);

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/espace"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Finance
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Total encaissé :{" "}
            <span className="font-bold text-green-600">
              {formatFCFA(totalCollected)}
            </span>
          </p>

          {rows.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucun étudiant.
            </p>
          ) : (
            <ul className="mt-8 divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              {rows.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/espace/finance/${r.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-ipmd-light"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ipmd-black">
                        {r.full_name || r.email}
                      </p>
                      <p className="truncate text-xs text-black/50">
                        Dû {formatFCFA(r.due)} · Payé {formatFCFA(r.paid)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                        r.balance <= 0
                          ? "bg-green-600/10 text-green-700"
                          : "bg-ipmd-red/10 text-ipmd-red"
                      }`}
                    >
                      {r.balance <= 0
                        ? "À jour"
                        : `Reste ${formatFCFA(r.balance)}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}
