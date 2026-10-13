"use client";

import { useActionState } from "react";
import { sendDirectMessage } from "@/lib/messaging-actions";
import { inputBase } from "@/components/forms/FormField";
import type { FormResult } from "@/types";

/** Envoi d'un message direct de l'IPMD à un parent (depuis l'annuaire admin). */
export function ParentMessageForm({
  parentId,
  parentName,
}: {
  parentId: string;
  parentName: string;
}) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    sendDirectMessage.bind(null, parentId),
    null
  );

  return (
    <details className="mt-2 rounded-lg bg-ipmd-light/60 px-3 py-2 text-xs">
      <summary className="cursor-pointer font-semibold text-ipmd-black">
        ✉️ Envoyer un message
      </summary>
      <form action={action} className="mt-2 space-y-2">
        <input
          name="subject"
          required
          placeholder="Objet"
          className={`${inputBase} h-8 py-1 text-[12px]`}
        />
        <textarea
          name="body"
          required
          rows={3}
          placeholder={`Message à ${parentName}…`}
          className={`${inputBase} py-1.5 text-[12px]`}
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-ipmd-black px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-40"
          >
            {pending ? "Envoi…" : "Envoyer"}
          </button>
          {state && (
            <span
              className={`text-[11px] font-medium ${
                state.ok ? "text-green-600" : "text-ipmd-red"
              }`}
            >
              {state.message}
            </span>
          )}
        </div>
      </form>
    </details>
  );
}
