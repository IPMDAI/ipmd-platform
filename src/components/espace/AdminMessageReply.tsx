"use client";

import { useActionState } from "react";
import { replyInternalMessage } from "@/lib/messaging-actions";
import { inputBase } from "@/components/forms/FormField";
import type { FormResult } from "@/types";

export function AdminMessageReply({
  messageId,
  current,
}: {
  messageId: string;
  current: string | null;
}) {
  const bound = replyInternalMessage.bind(null, messageId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );

  return (
    <form action={action} className="mt-3 space-y-2">
      <textarea
        name="reply"
        rows={2}
        defaultValue={current ?? ""}
        placeholder="Votre réponse…"
        className={inputBase}
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-ipmd-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Envoi…" : current ? "Modifier la réponse" : "Répondre"}
        </button>
        {state && (
          <span
            className={`text-sm font-medium ${
              state.ok ? "text-green-600" : "text-ipmd-red"
            }`}
          >
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
