import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { deleteContactMessage } from "@/lib/contact-actions";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Messages de contact",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function MessagesPage() {
  const { supabase } = await requireAdmin();

  const { data: rows } = await supabase
    .from("contact_messages")
    .select("id, full_name, email, subject, message, created_at")
    .order("created_at", { ascending: false });

  const messages = rows ?? [];

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
              Messages de contact
            </h1>
            <span className="rounded-full bg-ipmd-red px-2.5 py-1 text-xs font-bold text-white">
              {messages.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-black/55">
            Messages envoyés via le formulaire de contact du site.
          </p>

          {messages.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucun message pour le moment.
            </p>
          ) : (
            <ul className="mt-8 space-y-4">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="text-lg font-bold text-ipmd-black">
                      {m.subject || "Sans objet"}
                    </h2>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-black/40">
                        {formatDate(m.created_at)}
                      </span>
                      <form action={deleteContactMessage}>
                        <input type="hidden" name="id" value={m.id} />
                        <button
                          type="submit"
                          className="rounded-full px-2.5 py-1 text-xs font-semibold text-ipmd-red transition-colors hover:bg-ipmd-red hover:text-white"
                          title="Supprimer ce message"
                        >
                          🗑 Supprimer
                        </button>
                      </form>
                    </div>
                  </div>

                  <a
                    href={`mailto:${m.email}`}
                    className="mt-1 inline-block text-sm font-medium text-ipmd-black hover:text-ipmd-red"
                  >
                    {m.full_name} · {m.email}
                  </a>

                  <p className="mt-3 whitespace-pre-line rounded-xl bg-ipmd-light px-4 py-3 text-sm leading-relaxed text-black/70">
                    {m.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}
