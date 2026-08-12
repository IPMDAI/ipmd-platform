"use client";

import { useActionState, useState } from "react";
import { sendDossierLink } from "@/lib/dossier-actions";
import type { FormResult } from "@/types";

/**
 * Actions admin pour réclamer les pièces d'une candidature incomplète :
 * copier le lien unique « Compléter mon dossier » ou l'envoyer par email au
 * candidat. Aucune donnée sensible dans le lien (jeton signé opaque).
 */
export function DossierLinkActions({
  url,
  candidatureId,
  email,
}: {
  url: string;
  candidatureId: string;
  email: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    sendDossierLink,
    null
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
        ⚠ Dossier incomplet — réclamer les pièces
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ipmd-black ring-1 ring-black/10 transition-colors hover:ring-ipmd-red/40"
        >
          {copied ? "✅ Lien copié" : "🔗 Copier le lien"}
        </button>

        <form action={action}>
          <input type="hidden" name="candidature_id" value={candidatureId} />
          <button
            type="submit"
            disabled={pending || !email}
            className="rounded-full bg-ipmd-black px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            title={email ? `Envoyer à ${email}` : "Aucun email"}
          >
            {pending ? "Envoi…" : "✉️ Envoyer le lien par email"}
          </button>
        </form>
      </div>
      {state && (
        <p
          className={`mt-2 text-xs font-medium ${
            state.ok ? "text-green-600" : "text-ipmd-red"
          }`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
