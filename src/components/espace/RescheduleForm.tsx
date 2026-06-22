"use client";

import { useActionState } from "react";
import { rescheduleSession } from "@/lib/session-actions";
import { inputBase } from "@/components/forms/FormField";
import type { FormResult } from "@/types";

export function RescheduleForm({ sessionId }: { sessionId: string }) {
  const bound = rescheduleSession.bind(null, sessionId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );

  return (
    <form action={action} className="mt-2 flex flex-wrap items-end gap-2">
      <label className="text-[11px] font-semibold text-black/55">
        Nouvelle date
        <input
          name="new_date"
          type="date"
          required
          className={`${inputBase} mt-1 py-1.5 text-sm`}
        />
      </label>
      <label className="text-[11px] font-semibold text-black/55">
        Début
        <input name="new_start" type="time" className={`${inputBase} mt-1 py-1.5 text-sm`} />
      </label>
      <label className="text-[11px] font-semibold text-black/55">
        Fin
        <input name="new_end" type="time" className={`${inputBase} mt-1 py-1.5 text-sm`} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ipmd-black px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        {pending ? "…" : "🔁 Programmer le rattrapage"}
      </button>
      {state && (
        <p className={`w-full text-xs font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
