import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { Container } from "@/components/ui/Container";
import { RetryEmailButton } from "@/components/espace/RetryEmailButton";
import { parcoursLabel } from "@/lib/reglement-email-content";

export const metadata: Metadata = { title: "Emails d'acceptation du règlement" };

type Row = {
  id: string;
  scope: string;
  recipient: string;
  parcours: "diplome" | "bootcamp";
  version: string;
  status: "pending" | "sent" | "failed" | "skipped";
  error: string | null;
  provider_message_id: string | null;
  attempts: number;
  created_at: string;
  sent_at: string | null;
};

const STATUS: Record<Row["status"], { label: string; cls: string }> = {
  sent: { label: "Envoyé", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  failed: { label: "Échec", cls: "bg-red-50 text-red-700 ring-red-200" },
  skipped: { label: "Ignoré (test)", cls: "bg-amber-50 text-amber-800 ring-amber-200" },
  pending: { label: "En cours", cls: "bg-black/5 text-black/60 ring-black/10" },
};

function fmt(iso: string | null): string {
  return iso
    ? new Date(iso).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
}

export default async function ReglementEmailsPage() {
  const { supabase, userId } = await requireUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (me?.role !== "admin" && me?.role !== "super_admin") redirect("/espace");

  const admin = createAdminClient();
  const { data } = admin
    ? await admin
        .from("reglement_emails")
        .select(
          "id, scope, recipient, parcours, version, status, error, provider_message_id, attempts, created_at, sent_at"
        )
        .order("created_at", { ascending: false })
        .limit(200)
    : { data: [] as Row[] };
  const rows = (data ?? []) as Row[];

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-10 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <Link href="/espace" className="text-sm font-semibold text-black/50 hover:text-ipmd-red">
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-4 text-2xl font-extrabold text-ipmd-black">
            Emails d&apos;acceptation du règlement
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Copie et statut d&apos;envoi de chaque confirmation. Un échec peut être relancé sans
            créer de seconde acceptation ni de doublon.
          </p>

          <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="border-b border-black/10 text-[11px] uppercase tracking-wider text-black/50">
                <tr>
                  <th className="px-4 py-3">Destinataire</th>
                  <th className="px-4 py-3">Parcours</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Tent.</th>
                  <th className="px-4 py-3">Créé</th>
                  <th className="px-4 py-3">Détail / action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-black/50">
                      Aucun email pour le moment.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="align-top">
                      <td className="px-4 py-3 font-medium text-ipmd-black">{r.recipient}</td>
                      <td className="px-4 py-3 text-black/70">{parcoursLabel(r.parcours)}</td>
                      <td className="px-4 py-3 text-black/60">{r.version}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${STATUS[r.status].cls}`}
                        >
                          {STATUS[r.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-black/60">{r.attempts}</td>
                      <td className="px-4 py-3 text-black/60">{fmt(r.created_at)}</td>
                      <td className="px-4 py-3">
                        {r.status === "sent" ? (
                          <span className="text-[11px] text-black/50">
                            Envoyé le {fmt(r.sent_at)}
                            {r.provider_message_id ? ` · id ${r.provider_message_id.slice(0, 10)}…` : ""}
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {r.error && <span className="text-[11px] text-red-600">{r.error}</span>}
                            <RetryEmailButton id={r.id} />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Container>
    </section>
  );
}
