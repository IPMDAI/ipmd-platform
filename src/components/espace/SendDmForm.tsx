"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendDirectMessage } from "@/lib/social-actions";
import type { FormResult } from "@/types";

export function SendDmForm({ recipientId }: { recipientId: string }) {
  const bound = sendDirectMessage.bind(null, recipientId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form
      ref={ref}
      action={action}
      className="flex items-center gap-2 border-t border-black/5 bg-white p-3"
    >
      <input
        name="body"
        required
        autoComplete="off"
        placeholder="Écris un message…"
        className="flex-1 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-ipmd-red"
      />
      <button
        type="submit"
        disabled={pending}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ipmd-red text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        aria-label="Envoyer"
      >
        ➤
      </button>
      {state && !state.ok && (
        <span className="text-xs text-ipmd-red">{state.message}</span>
      )}
    </form>
  );
}
