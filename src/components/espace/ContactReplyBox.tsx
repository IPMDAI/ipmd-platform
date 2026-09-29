"use client";

import { useActionState, useState } from "react";
import { replyToContactMessage } from "@/lib/contact-actions";
import type { FormResult } from "@/types";

/** Répondre à un message de contact (email à l'expéditeur + copie info@ipmd.pro). */
export function ContactReplyBox({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    replyToContactMessage,
    null
  );

  if (state?.ok) {
    return <p className="mt-2 text-sm font-semibold text-green-700">✅ {state.message}</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-ipmd-red px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
      >
        ✉️ Répondre
      </button>
    );
  }

  return (
    <form action={action} className="mt-2 w-full">
      <input type="hidden" name="id" value={id} />
      <textarea
        name="body"
        rows={4}
        required
        placeholder="Votre réponse… (elle sera envoyée à la personne, avec une copie dans info@ipmd.pro)"
        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ipmd-red/40"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-ipmd-red px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Envoi…" : "Envoyer la réponse"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-semibold text-black/50 hover:text-ipmd-red"
        >
          Annuler
        </button>
        {state && !state.ok && <span className="text-xs text-ipmd-red">{state.message}</span>}
      </div>
    </form>
  );
}
