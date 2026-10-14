"use client";

import { useActionState, useEffect, useRef } from "react";
import { createStaffingDraft, updateStaffingDraft } from "@/lib/staffing-actions";
import { NEED_TYPES, PRIORITIES, type StaffingRequestRow } from "@/lib/staffing";
import type { FormResult } from "@/types";

export type StaffingOptions = {
  years: { value: string; active: boolean }[];
  classes: { id: string; label: string }[];
  modules: { id: string; label: string }[];
};

const inputCls =
  "mt-0.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm focus:border-ipmd-red focus:outline-none";
const labelCls = "block text-xs font-semibold text-black/60";

/**
 * Formulaire de besoin en personnel (création d'un brouillon ou édition d'un
 * brouillon existant). AUCUN pouvoir de décision ici — seulement exprimer le
 * besoin. L'édition n'est montée que pour un brouillon (statut vérifié côté base).
 */
export function StaffingRequestForm({
  mode,
  requestId,
  initial,
  options,
}: {
  mode: "create" | "edit";
  requestId?: string;
  initial?: Partial<StaffingRequestRow>;
  options: StaffingOptions;
}) {
  const action =
    mode === "edit" && requestId
      ? updateStaffingDraft.bind(null, requestId)
      : createStaffingDraft;
  const [state, formAction, pending] = useActionState<FormResult | null, FormData>(
    action,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  // En création réussie, on vide le formulaire (la liste se rafraîchit via revalidate).
  useEffect(() => {
    if (mode === "create" && state?.ok) formRef.current?.reset();
  }, [state, mode]);

  const defaultYear =
    initial?.academic_year ?? options.years.find((y) => y.active)?.value ?? "";

  return (
    <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className={labelCls}>
        Type de besoin
        <select name="need_type" defaultValue={initial?.need_type ?? "enseignant"} className={inputCls}>
          {NEED_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </label>

      <label className={labelCls}>
        Priorité
        <select name="priority" defaultValue={initial?.priority ?? "normale"} className={inputCls}>
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </label>

      <label className={`${labelCls} sm:col-span-2`}>
        Poste / intitulé
        <input
          name="position_title"
          defaultValue={initial?.position_title ?? ""}
          required
          placeholder="Ex. Enseignant de Marketing digital (L1)"
          className={inputCls}
        />
      </label>

      <label className={labelCls}>
        Année académique
        <select name="academic_year" defaultValue={defaultYear} className={inputCls}>
          <option value="">— Non précisée —</option>
          {options.years.map((y) => (
            <option key={y.value} value={y.value}>
              {y.value}{y.active ? " (active)" : ""}
            </option>
          ))}
        </select>
      </label>

      <label className={labelCls}>
        Classe (si applicable)
        <select name="class_id" defaultValue={initial?.class_id ?? ""} className={inputCls}>
          <option value="">— Aucune —</option>
          {options.classes.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </label>

      <label className={labelCls}>
        Module (si applicable)
        <select name="module_id" defaultValue={initial?.module_id ?? ""} className={inputCls}>
          <option value="">— Aucun —</option>
          {options.modules.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </label>

      <label className={`${labelCls} sm:col-span-2`}>
        Profil souhaité (facultatif)
        <input
          name="proposed_profile"
          defaultValue={initial?.proposed_profile ?? ""}
          placeholder="Suggestion libre (nom, type de profil…). N'affecte personne."
          className={inputCls}
        />
      </label>

      <label className={`${labelCls} sm:col-span-2`}>
        Justification
        <textarea
          name="justification"
          defaultValue={initial?.justification ?? ""}
          required
          rows={3}
          placeholder="Pourquoi ce besoin ? Contexte, charge, échéance…"
          className={inputCls}
        />
      </label>

      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-ipmd-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "…" : mode === "edit" ? "Enregistrer les modifications" : "Créer le brouillon"}
        </button>
        {state && (
          <p className={`text-xs font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
