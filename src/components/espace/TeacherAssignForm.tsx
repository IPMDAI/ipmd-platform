"use client";

import { useActionState } from "react";
import type { FormResult } from "@/types";

export type EligibleTeacher = { id: string; name: string; charge?: string | null };

/**
 * Formulaire d'affectation pédagogique (module / créneau / séance). Ne liste que
 * des enseignants ÉLIGIBLES (fournis par le serveur) et impose un MOTIF ; la RPC
 * D7-2 revérifie éligibilité + concurrence + audit. `action` est une server
 * action D7-3 déjà liée (bind) à l'entité concernée.
 */
export function TeacherAssignForm({
  action,
  eligible,
  currentTeacherId,
  currentTeacherName,
  submitLabel = "Affecter",
  motifPlaceholder = "Motif de l'affectation (obligatoire)",
}: {
  action: (prev: FormResult | null, formData: FormData) => Promise<FormResult>;
  eligible: EligibleTeacher[];
  currentTeacherId: string | null;
  currentTeacherName: string | null;
  submitLabel?: string;
  motifPlaceholder?: string;
}) {
  const [state, formAction, pending] = useActionState<FormResult | null, FormData>(action, null);
  const input =
    "mt-0.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm focus:border-ipmd-red focus:outline-none";

  return (
    <form action={formAction} className="space-y-3">
      {/* Concurrence : on renvoie l'enseignant qu'on croyait en place. */}
      <input type="hidden" name="expected_teacher" value={currentTeacherId ?? ""} />

      <p className="text-xs text-black/55">
        Enseignant actuel : <strong>{currentTeacherName ?? "— Aucun —"}</strong>
      </p>

      <label className="block text-xs font-semibold text-black/60">
        Nouvel enseignant (éligibles seulement)
        <select name="new_teacher" required defaultValue="" className={input}>
          <option value="" disabled>— Choisir un enseignant —</option>
          {eligible.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
              {e.charge ? ` — ${e.charge}` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-xs font-semibold text-black/60">
        Motif
        <textarea name="motif" required rows={2} placeholder={motifPlaceholder} className={input} />
      </label>

      <button
        type="submit"
        disabled={pending || eligible.length === 0}
        className="rounded-lg bg-ipmd-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "…" : submitLabel}
      </button>

      {eligible.length === 0 && (
        <p className="text-xs text-black/50">
          Aucun enseignant éligible (fiche pédagogique au statut validé/actif) pour l&apos;instant.
        </p>
      )}
      {state && (
        <p className={`text-xs font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
