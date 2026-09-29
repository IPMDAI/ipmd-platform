import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { deleteContactMessage, setContactSpam } from "@/lib/contact-actions";
import { ContactReplyBox } from "@/components/espace/ContactReplyBox";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Messages de contact",
};

type Msg = {
  id: string;
  full_name: string | null;
  email: string | null;
  subject: string | null;
  message: string | null;
  created_at: string;
  is_spam: boolean;
  replied_at: string | null;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// Heuristique « probable spam » (référencement, marketing, arnaques) — indicatif,
// n'archive rien automatiquement.
const SPAM_HINTS = [
  "search-ipmd",
  "searchindex",
  "searchregister",
  "turbojot",
  "domains@",
  ".live",
  "google's search index",
  "search index",
  "worldwide",
  "millions",
  "include ipmd.pro",
  "register ipmd",
];
function looksSpam(m: Msg): boolean {
  const hay = `${m.email ?? ""} ${m.subject ?? ""} ${m.message ?? ""}`.toLowerCase();
  return SPAM_HINTS.some((h) => hay.includes(h));
}

function MessageCard({ m }: { m: Msg }) {
  const suspicious = !m.is_spam && looksSpam(m);
  return (
    <li className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-bold text-ipmd-black">{m.subject || "Sans objet"}</h2>
        <span className="text-xs text-black/40">{formatDate(m.created_at)}</span>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-2">
        <a
          href={`mailto:${m.email}`}
          className="text-sm font-medium text-ipmd-black hover:text-ipmd-red"
        >
          {m.full_name} · {m.email}
        </a>
        {m.replied_at && (
          <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700 ring-1 ring-green-200">
            ✅ Répondu le {formatDate(m.replied_at)}
          </span>
        )}
        {suspicious && (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">
            ⚠ Probable spam
          </span>
        )}
      </div>

      <p className="mt-3 whitespace-pre-line rounded-xl bg-ipmd-light px-4 py-3 text-sm leading-relaxed text-black/70">
        {m.message}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {!m.is_spam && <ContactReplyBox id={m.id} />}
        <form action={setContactSpam}>
          <input type="hidden" name="id" value={m.id} />
          <input type="hidden" name="spam" value={m.is_spam ? "0" : "1"} />
          <button
            type="submit"
            className="rounded-full px-2.5 py-1 text-xs font-semibold text-black/60 transition-colors hover:bg-black/5"
          >
            {m.is_spam ? "↩ Retirer du spam" : "🚫 Marquer comme spam"}
          </button>
        </form>
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
    </li>
  );
}

export default async function MessagesPage() {
  const { supabase } = await requireAdmin();

  const { data: rows } = await supabase
    .from("contact_messages")
    .select("id, full_name, email, subject, message, created_at, is_spam, replied_at")
    .order("created_at", { ascending: false });

  const messages = (rows ?? []) as Msg[];
  const inbox = messages.filter((m) => !m.is_spam);
  const spam = messages.filter((m) => m.is_spam);

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
              {inbox.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-black/55">
            Messages envoyés via le formulaire de contact. « Répondre » envoie un email à la
            personne, avec une copie dans info@ipmd.pro.
          </p>

          {inbox.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucun message à traiter.
            </p>
          ) : (
            <ul className="mt-8 space-y-4">
              {inbox.map((m) => (
                <MessageCard key={m.id} m={m} />
              ))}
            </ul>
          )}

          {spam.length > 0 && (
            <details className="mt-8">
              <summary className="cursor-pointer text-sm font-semibold text-black/55 hover:text-ipmd-red">
                🚫 Spam ({spam.length}) — masqués
              </summary>
              <ul className="mt-4 space-y-4 opacity-75">
                {spam.map((m) => (
                  <MessageCard key={m.id} m={m} />
                ))}
              </ul>
            </details>
          )}
        </div>
      </Container>
    </section>
  );
}
