"use client";

import { useState } from "react";
import { postCandidateReply, type ThreadMessage } from "@/lib/dossier-actions";
import { MessageComposer } from "@/components/ui/MessageComposer";
import { MessageText } from "@/components/ui/MessageText";

function time(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Conversation candidat ↔ IPMD sur le lien sécurisé (sans compte). Le candidat lit
 * les messages de l'équipe et répond ; la réponse est postée via une action
 * serveur token-gated (`postCandidateReply`).
 */
export function DossierConversation({
  token,
  initial,
}: {
  token: string;
  initial: ThreadMessage[];
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initial);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function send() {
    const text = body.trim();
    if (!text) return;
    setPending(true);
    setErr(null);
    const res = await postCandidateReply(token, text);
    setPending(false);
    if (!res.ok) {
      setErr(res.message);
      return;
    }
    setMessages((m) => [
      ...m,
      {
        id: `local-${Date.now()}`,
        sender: "candidate",
        body: text,
        author_name: null,
        created_at: new Date().toISOString(),
      },
    ]);
    setBody("");
  }

  return (
    <div>
      <h2 className="text-sm font-bold uppercase tracking-wide text-ipmd-red">
        Échanger avec l&apos;IPMD
      </h2>
      <p className="mt-1 text-xs text-black/50">
        Posez vos questions à l&apos;équipe Admissions. Vous recevrez la réponse ici.
      </p>

      {messages.length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {messages.map((m) => {
            const mine = m.sender === "candidate";
            return (
              <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    mine
                      ? "bg-ipmd-black text-white"
                      : "bg-ipmd-light text-ipmd-black ring-1 ring-black/5"
                  }`}
                >
                  <MessageText body={m.body} className="leading-relaxed" />
                  <p className={`mt-1 text-[10px] ${mine ? "text-white/50" : "text-black/40"}`}>
                    {mine ? "Vous" : m.author_name || "IPMD"} · {time(m.created_at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4">
        <MessageComposer
          value={body}
          onChange={setBody}
          placeholder="Écrire un message à l'IPMD…"
          maxLength={4000}
        />
        {err && <p className="mt-1 text-sm font-medium text-ipmd-red">{err}</p>}
        <button
          type="button"
          onClick={send}
          disabled={pending || body.trim().length === 0}
          className="mt-2 rounded-full bg-ipmd-red px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {pending ? "Envoi…" : "Envoyer"}
        </button>
      </div>
    </div>
  );
}
