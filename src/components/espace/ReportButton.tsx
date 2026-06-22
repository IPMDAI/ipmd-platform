"use client";

import { useActionState, useState } from "react";
import { reportContent } from "@/lib/moderation-actions";
import type { FormResult } from "@/types";

export function ReportButton({
  contentType,
  contentId,
}: {
  contentType: string;
  contentId: string;
}) {
  const bound = reportContent.bind(null, contentType, contentId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );
  const [open, setOpen] = useState(false);

  if (state?.ok) {
    return <span className="text-xs font-semibold text-green-600">✓ Signalé</span>;
  }

  return (
    <div>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-semibold text-black/40 transition-colors hover:text-ipmd-red"
        >
          ⚐ Signaler
        </button>
      ) : (
        <form action={action} className="flex items-center gap-2">
          <input
            name="reason"
            placeholder="Motif (optionnel)"
            className="rounded-lg border border-black/10 px-2 py-1 text-xs outline-none focus:border-ipmd-red"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-ipmd-red px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
          >
            {pending ? "…" : "Envoyer"}
          </button>
        </form>
      )}
      {state && !state.ok && (
        <p className="mt-1 text-xs text-ipmd-red">{state.message}</p>
      )}
    </div>
  );
}
