"use client";

import { useActionState, useState } from "react";
import { reviewDocument } from "@/lib/student-document-actions";
import { inputBase } from "@/components/forms/FormField";
import type { FormResult } from "@/types";

/** Boutons staff : valider / refuser (motif) une soumission. */
export function DocReview({ submissionId }: { submissionId: string }) {
  const [refusing, setRefusing] = useState(false);
  const [validState, validAction, validPending] = useActionState<FormResult | null, FormData>(
    reviewDocument.bind(null, submissionId, "valide"),
    null
  );
  const [refuseState, refuseAction, refusePending] = useActionState<FormResult | null, FormData>(
    reviewDocument.bind(null, submissionId, "refuse"),
    null
  );
  const msg = validState ?? refuseState;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <form action={validAction}>
          <button
            type="submit"
            disabled={validPending}
            className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
          >
            {validPending ? "…" : "✓ Valider"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setRefusing((v) => !v)}
          className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-ipmd-red ring-1 ring-ipmd-red/30"
        >
          Refuser
        </button>
        {msg && (
          <span className={`text-[11px] font-medium ${msg.ok ? "text-green-600" : "text-ipmd-red"}`}>
            {msg.message}
          </span>
        )}
      </div>

      {refusing && (
        <form action={refuseAction} className="flex flex-wrap items-start gap-2">
          <textarea
            name="note"
            required
            rows={2}
            placeholder="Motif du refus (obligatoire)"
            className={`${inputBase} min-w-[16rem] flex-1 py-1.5 text-[12px]`}
          />
          <button
            type="submit"
            disabled={refusePending}
            className="rounded-lg bg-ipmd-red px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
          >
            {refusePending ? "…" : "Confirmer le refus"}
          </button>
        </form>
      )}
    </div>
  );
}
