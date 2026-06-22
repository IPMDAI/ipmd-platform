import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import {
  resolveReport,
  deleteReportedContent,
} from "@/lib/moderation-actions";

export const metadata: Metadata = {
  title: "Modération",
};

const TYPE_LABEL: Record<string, string> = {
  class_announcement: "Annonce de classe",
  announcement: "Annonce générale",
  internal_message: "Message interne",
};

function frDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function ModerationPage() {
  const { supabase } = await requireAdmin();

  const { data: reportRows } = await supabase
    .from("content_reports")
    .select("id, reporter_id, content_type, content_id, reason, status, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false });
  const reports = reportRows ?? [];

  // Noms des signaleurs + aperçus du contenu.
  const reporterName = new Map<string, string>();
  const preview = new Map<string, string>();
  if (reports.length > 0) {
    const reporterIds = [...new Set(reports.map((r) => r.reporter_id))];
    const { data: people } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", reporterIds);
    for (const p of people ?? [])
      reporterName.set(p.id, p.full_name || "Membre");

    const classIds = reports
      .filter((r) => r.content_type === "class_announcement")
      .map((r) => r.content_id);
    if (classIds.length > 0) {
      const { data } = await supabase
        .from("class_announcements")
        .select("id, body")
        .in("id", classIds);
      for (const c of data ?? []) preview.set(c.id, c.body);
    }
    const annIds = reports
      .filter((r) => r.content_type === "announcement")
      .map((r) => r.content_id);
    if (annIds.length > 0) {
      const { data } = await supabase
        .from("announcements")
        .select("id, body")
        .in("id", annIds);
      for (const a of data ?? []) preview.set(a.id, a.body);
    }
  }

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
            Modération
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Contenus signalés par les membres, à traiter.
          </p>

          {reports.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucun signalement en attente. ✅
            </p>
          ) : (
            <ul className="mt-8 space-y-4">
              {reports.map((r) => (
                <li
                  key={r.id}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-ipmd-red/10 px-2.5 py-1 text-[11px] font-bold text-ipmd-red">
                      {TYPE_LABEL[r.content_type] ?? r.content_type}
                    </span>
                    <span className="text-xs text-black/40">
                      Signalé par {reporterName.get(r.reporter_id) ?? "—"} ·{" "}
                      {frDate(r.created_at)}
                    </span>
                  </div>
                  {r.reason && (
                    <p className="mt-2 text-sm italic text-black/60">
                      Motif : {r.reason}
                    </p>
                  )}
                  <p className="mt-2 whitespace-pre-line rounded-xl bg-ipmd-light px-4 py-3 text-sm leading-relaxed text-black/70">
                    {preview.get(r.content_id) ?? "(contenu supprimé)"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={resolveReport.bind(null, r.id)}>
                      <button className="rounded-full bg-ipmd-light px-3 py-1.5 text-xs font-semibold text-black/60">
                        Marquer traité
                      </button>
                    </form>
                    <form
                      action={deleteReportedContent.bind(
                        null,
                        r.content_type,
                        r.content_id,
                        r.id
                      )}
                    >
                      <button className="rounded-full bg-ipmd-red px-3 py-1.5 text-xs font-semibold text-white">
                        Supprimer le contenu
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}
