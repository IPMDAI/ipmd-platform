"use client";

import { useActionState } from "react";
import { setFinanceSettings, setTuitionLevel } from "@/lib/finance-config-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

export function FinanceSettingsForm({
  registrationFee,
  discountPct,
  academicYear,
}: {
  registrationFee: number;
  discountPct: number;
  academicYear: string;
}) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    setFinanceSettings,
    null
  );
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Frais d'inscription (FCFA)" htmlFor="registration_fee">
          <input id="registration_fee" name="registration_fee" type="number" defaultValue={registrationFee} className={inputBase} />
        </Field>
        <Field label="Réduction paiement unique (%)" htmlFor="lump_sum_discount">
          <input id="lump_sum_discount" name="lump_sum_discount" type="number" step="0.1" defaultValue={discountPct} className={inputBase} />
        </Field>
        <Field label="Année académique" htmlFor="academic_year">
          <input id="academic_year" name="academic_year" defaultValue={academicYear} placeholder="2025-2026" className={inputBase} />
        </Field>
      </div>
      <ActionButton type="submit" disabled={pending}>
        {pending ? "…" : "Enregistrer les paramètres"}
      </ActionButton>
      {state && (
        <p className={`text-sm font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}

export function TuitionLevelForm({
  level,
  amount,
}: {
  level?: string;
  amount?: number;
}) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    setTuitionLevel,
    null
  );
  const isNew = !level;
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      {isNew ? (
        <label className="text-[11px] font-semibold text-black/55">
          Niveau / programme
          <input name="level" required placeholder="Ex. Licence 1, Master IA…" className={`${inputBase} mt-1`} />
        </label>
      ) : (
        <>
          <input type="hidden" name="level" value={level} />
          <span className="min-w-[140px] text-sm font-semibold text-ipmd-black">{level}</span>
        </>
      )}
      <label className="text-[11px] font-semibold text-black/55">
        Montant (FCFA)
        <input name="amount" type="number" defaultValue={amount ?? 0} className={`${inputBase} mt-1`} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ipmd-black px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        {pending ? "…" : isNew ? "Ajouter" : "Enregistrer"}
      </button>
      {state && (
        <span className={`text-xs font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>
          {state.message}
        </span>
      )}
    </form>
  );
}
