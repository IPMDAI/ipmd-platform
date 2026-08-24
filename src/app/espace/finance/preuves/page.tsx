import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { Container } from "@/components/ui/Container";
import { formatFCFA } from "@/lib/finance";
import { PaymentProofReview } from "@/components/espace/PaymentProofReview";

export const metadata: Metadata = { title: "Preuves à vérifier — Finance" };

function frDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Abidjan",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** File d'attente des preuves de paiement à vérifier (W3). Admin/super_admin. */
export default async function PreuvesPage() {
  await requireAdmin();
  const admin = createAdminClient();

  type Row = {
    id: string;
    candidature_id: string;
    method: string | null;
    amount_declared: number | string;
    reference: string | null;
    submitted_at: string | null;
    name: string;
  };
  let rows: Row[] = [];
  if (admin) {
    const { data: proofs } = await admin
      .from("payment_proofs")
      .select("id, candidature_id, method, amount_declared, reference, submitted_at")
      .eq("kind", "inscription")
      .eq("status", "a_verifier")
      .order("submitted_at", { ascending: true });

    const ids = [...new Set((proofs ?? []).map((p) => p.candidature_id as string))];
    const nameById = new Map<string, string>();
    if (ids.length) {
      const { data: cands } = await admin
        .from("inscription_requests")
        .select("id, full_name, email")
        .in("id", ids);
      for (const c of cands ?? []) {
        nameById.set(c.id as string, (c.full_name as string) || (c.email as string) || "—");
      }
    }
    rows = (proofs ?? []).map((p) => ({
      id: p.id as string,
      candidature_id: p.candidature_id as string,
      method: (p.method as string) ?? null,
      amount_declared: p.amount_declared as number,
      reference: (p.reference as string) ?? null,
      submitted_at: (p.submitted_at as string) ?? null,
      name: nameById.get(p.candidature_id as string) ?? "—",
    }));
  }

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">
          Preuves à vérifier{" "}
          <span className="ml-1 rounded-full bg-ipmd-red px-2 py-0.5 text-sm font-bold text-white">
            {rows.length}
          </span>
        </h1>
        <Link href="/espace/finance" className="text-sm font-semibold text-ipmd-red hover:underline">
          ← Finance
        </Link>
      </div>
      <p className="mt-1 text-sm text-black/55">
        Contrôlez chaque justificatif puis validez (preuve conforme) ou rejetez (avec motif).
        La validation n'enregistre <strong>aucun paiement</strong> — l'encaissement se fait ensuite
        dans le suivi financier.
      </p>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
          ✅ Aucune preuve en attente de vérification.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="text-sm">
                  <p className="font-bold text-ipmd-black">{r.name}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-black/70">
                    <span>Moyen : <strong>{r.method ?? "—"}</strong></span>
                    <span>Montant déclaré : <strong>{formatFCFA(Number(r.amount_declared))}</strong></span>
                    <span>Réf : {r.reference ?? "—"}</span>
                    <span>Déposée le {frDateTime(r.submitted_at)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <PaymentProofReview proofId={r.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
