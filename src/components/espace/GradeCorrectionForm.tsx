"use client";

import { useActionState } from "react";
import { correctGrade } from "@/lib/grade-correction-actions";
import type { FormResult } from "@/types";

/**
 * Formulaire de correction d'UNE note (Cas B — Directeur des Études).
 * Nouvelle note + motif obligatoire ; la trace d'audit est écrite côté DB.
 */
export function GradeCorrectionForm({
  gradeId,
  current,
  max,
}: {
  gradeId: string;
  current: number;
  max: number;
}) {
  const action = correctGrade.bind(null, gradeId);
  const [state, formAction, pending] = useActionState<FormResult | null, FormData>(
    action,
    null
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <label className="text-xs font-semibold text-black/55">
        Nouvelle note
        <input
          name="score"
          type="number"
          step="0.01"
          min={0}
          max={max}
          defaultValue={current}
          required
          className="mt-0.5 w-24 rounded-lg border border-black/15 bg-white px-2 py-1.5 text-sm focus:border-ipmd-red focus:outline-none"
        />
      </label>
      <label className="flex-1 text-xs font-semibold text-black/55">
        Motif (obligatoire)
        <input
          name="reason"
          required
          placeholder="Ex. erreur de saisie confirmée avec l'enseignant"
          className="mt-0.5 w-full min-w-[220px] rounded-lg border border-black/15 bg-white px-2 py-1.5 text-sm focus:border-ipmd-red focus:outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-ipmd-black px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
      >
        {pending ? "…" : "Corriger"}
      </button>
      {state && (
        <p
          className={`w-full text-xs font-medium ${
            state.ok ? "text-green-600" : "text-ipmd-red"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
