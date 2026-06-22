import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { universes } from "@/data/universes";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Candidatures",
};

const universeNames: Record<string, string> = Object.fromEntries(
  universes.map((u) => [u.id, u.name])
);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function CandidaturesPage() {
  const { supabase } = await requireAdmin();

  const { data: rows } = await supabase
    .from("inscription_requests")
    .select(
      "id, full_name, email, phone, universe, program_interest, entry_level, message, created_at"
    )
    .order("created_at", { ascending: false });

  const candidatures = rows ?? [];

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
          <div className="mt-3 flex items-baseline gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">
              Candidatures
            </h1>
            <span className="rounded-full bg-ipmd-red px-2.5 py-1 text-xs font-bold text-white">
              {candidatures.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-black/55">
            Demandes d&apos;inscription reçues via le site, de la plus récente à
            la plus ancienne.
          </p>

          {candidatures.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucune candidature pour le moment.
            </p>
          ) : (
            <ul className="mt-8 space-y-4">
              {candidatures.map((c) => (
                <li
                  key={c.id}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="text-lg font-bold text-ipmd-black">
                      {c.full_name}
                    </h2>
                    <span className="text-xs text-black/40">
                      {formatDate(c.created_at)}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-ipmd-black px-2.5 py-1 text-[11px] font-semibold text-white">
                      {universeNames[c.universe] ?? c.universe}
                    </span>
                    {c.program_interest && (
                      <span className="rounded-full bg-ipmd-red/10 px-2.5 py-1 text-[11px] font-semibold text-ipmd-red">
                        {c.program_interest}
                      </span>
                    )}
                    {c.entry_level && (
                      <span className="rounded-full bg-ipmd-light px-2.5 py-1 text-[11px] font-semibold text-black/60">
                        {c.entry_level}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <a
                      href={`mailto:${c.email}`}
                      className="font-medium text-ipmd-black hover:text-ipmd-red"
                    >
                      ✉️ {c.email}
                    </a>
                    <a
                      href={`tel:${c.phone}`}
                      className="font-medium text-ipmd-black hover:text-ipmd-red"
                    >
                      📞 {c.phone}
                    </a>
                  </div>

                  {c.message && (
                    <p className="mt-3 whitespace-pre-line rounded-xl bg-ipmd-light px-4 py-3 text-sm leading-relaxed text-black/70">
                      {c.message}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}
