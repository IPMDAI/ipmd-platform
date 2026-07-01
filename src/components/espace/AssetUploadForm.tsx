"use client";

import { useActionState } from "react";
import { uploadOfficialAsset } from "@/lib/official-asset-actions";
import type { FormResult } from "@/types";

/** Formulaire de dépôt d'une signature/cachet, avec état « Envoi… » + message. */
export function AssetUploadForm({
  assetKey,
  present,
}: {
  assetKey: string;
  present: boolean;
}) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    uploadOfficialAsset,
    null
  );

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <input type="hidden" name="key" value={assetKey} />
        <input
          type="file"
          name="file"
          accept="image/*"
          required
          className="max-w-[170px] text-xs file:mr-2 file:rounded-full file:border-0 file:bg-ipmd-light file:px-3 file:py-1.5 file:text-xs file:font-semibold"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-ipmd-red px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Envoi…" : present ? "Remplacer" : "Déposer"}
        </button>
      </div>
      {state && (
        <span
          className={`text-[11px] font-medium ${
            state.ok ? "text-green-600" : "text-ipmd-red"
          }`}
        >
          {state.message}
        </span>
      )}
    </form>
  );
}
