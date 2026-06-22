import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { NewAnnouncementForm } from "@/components/espace/NewAnnouncementForm";
import { deleteAnnouncement } from "@/lib/announcement-actions";
import { AUDIENCE_LABEL } from "@/lib/announcements";

export const metadata: Metadata = {
  title: "Annonces",
};

function frDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function AnnoncesPage() {
  const { supabase } = await requireAdmin();

  const { data: rows } = await supabase
    .from("announcements")
    .select("id, title, body, audience, created_at")
    .order("created_at", { ascending: false });
  const announcements = rows ?? [];

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
            Annonces
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Communiquez avec les étudiants, parents et enseignants.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
            {/* Liste */}
            <div className="order-2 lg:order-1">
              {announcements.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucune annonce publiée.
                </p>
              ) : (
                <ul className="space-y-4">
                  {announcements.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="font-bold text-ipmd-black">{a.title}</h2>
                        <form action={deleteAnnouncement.bind(null, a.id)}>
                          <button
                            type="submit"
                            className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-ipmd-red transition-colors hover:bg-ipmd-red/10"
                          >
                            Suppr.
                          </button>
                        </form>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                        <span className="rounded-full bg-ipmd-black px-2.5 py-1 font-semibold text-white">
                          {AUDIENCE_LABEL[a.audience] ?? a.audience}
                        </span>
                        <span className="rounded-full bg-ipmd-light px-2.5 py-1 font-semibold text-black/55">
                          {frDate(a.created_at)}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-black/70">
                        {a.body}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Formulaire */}
            <div className="order-1 lg:order-2">
              <NewAnnouncementForm />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
