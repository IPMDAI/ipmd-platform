import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { SendMessageForm } from "@/components/espace/SendMessageForm";
import { AdminMessageReply } from "@/components/espace/AdminMessageReply";
import { MESSAGE_CATEGORY_LABEL } from "@/lib/messaging";

export const metadata: Metadata = {
  title: "Messagerie",
};

type Msg = {
  id: string;
  sender_id: string;
  category: string;
  subject: string;
  body: string;
  admin_reply: string | null;
  status: string;
  created_at: string;
};

function frDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function MessageriePage() {
  const { supabase, userId } = await requireUser();

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  const isAdmin = me?.role === "admin" || me?.role === "super_admin";

  const { data: rows } = await supabase
    .from("internal_messages")
    .select("id, sender_id, category, subject, body, admin_reply, status, created_at")
    .order("created_at", { ascending: false });
  const messages = (rows ?? []) as Msg[];

  // Noms des expéditeurs (admin).
  const senderName = new Map<string, string>();
  if (isAdmin && messages.length > 0) {
    const ids = [...new Set(messages.map((m) => m.sender_id))];
    const { data: people } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ids);
    for (const p of people ?? [])
      senderName.set(p.id, p.full_name || "Membre");
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
            Messagerie
          </h1>
          <p className="mt-1 text-sm text-black/55">
            {isAdmin
              ? "Messages reçus des étudiants, parents et enseignants."
              : "Échange avec l'administration de l'IPMD."}
          </p>

          {/* Formulaire d'envoi (non-admin) */}
          {!isAdmin && (
            <div className="mt-8">
              <SendMessageForm />
            </div>
          )}

          {/* Liste */}
          <div className="mt-8 space-y-4">
            {messages.length === 0 ? (
              <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                {isAdmin
                  ? "Aucun message reçu."
                  : "Tu n'as pas encore écrit à l'administration."}
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="font-bold text-ipmd-black">{m.subject}</h2>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          m.status === "repondu"
                            ? "bg-green-50 text-green-700"
                            : "bg-ipmd-red/10 text-ipmd-red"
                        }`}
                      >
                        {m.status === "repondu" ? "Répondu" : "En attente"}
                      </span>
                      <span className="text-xs text-black/40">
                        {frDate(m.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                    <span className="rounded-full bg-ipmd-black px-2.5 py-1 font-semibold text-white">
                      {MESSAGE_CATEGORY_LABEL[m.category] ?? m.category}
                    </span>
                    {isAdmin && (
                      <span className="rounded-full bg-ipmd-light px-2.5 py-1 font-semibold text-black/60">
                        👤 {senderName.get(m.sender_id) ?? "—"}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-black/70">
                    {m.body}
                  </p>

                  {/* Réponse */}
                  {m.admin_reply && (
                    <div className="mt-3 rounded-xl bg-ipmd-light px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-ipmd-red">
                        Réponse de l&apos;administration
                      </p>
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-black/75">
                        {m.admin_reply}
                      </p>
                    </div>
                  )}

                  {isAdmin && (
                    <AdminMessageReply messageId={m.id} current={m.admin_reply} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
