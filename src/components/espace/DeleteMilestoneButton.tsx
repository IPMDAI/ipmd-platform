"use client";

import { useActionState } from "react";
import { deleteCalendarMilestone } from "@/lib/calendar-actions";
import type { FormResult } from "@/types";

export function DeleteMilestoneButton({ id, label }: { id: string; label: string }) {
  const bound = deleteCalendarMilestone.bind(null, id);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(bound, null);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Supprimer le jalon « ${label} » ? Cette action est définitive.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="confirm" value="oui" />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-ipmd-red transition-colors hover:bg-ipmd-red/10"
      >
        Supprimer
      </button>
      {state && !state.ok && (
        <span className="ml-1 text-[11px] text-ipmd-red">{state.message}</span>
      )}
    </form>
  );
}
