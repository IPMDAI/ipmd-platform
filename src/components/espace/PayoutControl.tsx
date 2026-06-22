"use client";

import { useActionState } from "react";
import { setPayout } from "@/lib/payout-actions";
import { inputBase } from "@/components/forms/FormField";
import type { FormResult } from "@/types";

export function PayoutControl({
  teacherId,
  periodStart,
  periodEnd,
  hours,
  amount,
  current,
}: {
  teacherId: string;
  periodStart: string;
  periodEnd: string;
  hours: number;
  amount: number;
  current: string;
}) {
  const bound = setPayout.bind(null, teacherId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );

  return (
    <form action={action} className="mt-2 flex flex-wrap items-center gap-2">
      <input type="hidden" name="period_start" value={periodStart} />
      <input type="hidden" name="period_end" value={periodEnd} />
      <input type="hidden" name="hours" value={hours} />
      <input type="hidden" name="amount" value={amount} />
      <span className="text-[11px] font-semibold text-black/45">Paie :</span>
      <select
        name="status"
        defaultValue={current}
        className={`${inputBase} w-auto py-1 text-xs`}
      >
        <option value="en_attente">En attente</option>
        <option value="valide">Validé</option>
        <option value="paye">Payé</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ipmd-black px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
      >
        {pending ? "…" : "Enregistrer"}
      </button>
      {state && (
        <span
          className={`text-xs font-medium ${
            state.ok ? "text-green-600" : "text-ipmd-red"
          }`}
        >
          {state.message}
        </span>
      )}
    </form>
  );
}
