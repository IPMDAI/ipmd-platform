"use client";

import { useActionState } from "react";
import { inviteToEvent } from "@/lib/event-actions";
import { inputBase } from "@/components/forms/FormField";
import type { FormResult } from "@/types";

type Person = { id: string; full_name: string | null; email: string };

/** Invitation ciblée d'un utilisateur à un événement (envoi / renvoi). */
export function EventInviteForm({
  eventId,
  people,
}: {
  eventId: string;
  people: Person[];
}) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    inviteToEvent.bind(null, eventId),
    null
  );

  return (
    <details className="mt-2 text-xs">
      <summary className="cursor-pointer font-semibold text-ipmd-black">
        ✉️ Inviter quelqu&apos;un (ciblé)
      </summary>
      <form action={action} className="mt-2 flex flex-wrap items-center gap-2">
        <select name="user_id" defaultValue="" required className={`${inputBase} h-8 flex-1 py-1 text-[12px]`}>
          <option value="" disabled>— Choisir —</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name || p.email}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-md bg-ipmd-black px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-40"
        >
          {pending ? "…" : "Inviter"}
        </button>
        {state && (
          <span className={`text-[11px] font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>
            {state.message}
          </span>
        )}
      </form>
    </details>
  );
}
