"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { unlinkParentChild } from "@/lib/admin-actions";

/**
 * Bouton « Détacher » d'un enfant sur une fiche parent. Confirmation EXPLICITE
 * obligatoire avant suppression (jamais d'action silencieuse). Réutilise l'action
 * `unlinkParentChild`, qui ne supprime que la ligne `parent_links` (ni compte ni
 * donnée académique) et journalise l'action.
 */
export function UnlinkChildButton({
  linkId,
  childName,
  parentName,
}: {
  linkId: string;
  childName: string;
  parentName: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function detach() {
    startTransition(async () => {
      await unlinkParentChild(linkId);
      setConfirming(false);
      router.refresh();
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-ipmd-red ring-1 ring-ipmd-red/30 transition-colors hover:bg-ipmd-red/5"
      >
        Détacher
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-ipmd-red/30 bg-ipmd-red/[0.04] p-3">
      <p className="text-[13px] leading-relaxed text-ipmd-black">
        Confirmer le détachement de <strong>{childName}</strong> de{" "}
        <strong>{parentName}</strong> ? Cette action supprimera uniquement le lien
        parent-enfant. Aucun compte ni aucune donnée académique ne sera supprimé.
      </p>
      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={detach}
          disabled={pending}
          className="rounded-lg bg-ipmd-red px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {pending ? "Détachement…" : "Confirmer le détachement"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black/60 ring-1 ring-black/10 transition-colors hover:ring-black/25 disabled:opacity-40"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
