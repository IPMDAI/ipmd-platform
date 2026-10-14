"use client";

import { useActionState, useRef } from "react";
import { createInternship } from "@/lib/internship-actions";
import type { FormResult } from "@/types";

export type Opt = { value: string; label: string };

const field =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-ipmd-red focus:ring-2 focus:ring-ipmd-red/20";
const label = "block text-xs font-semibold text-black/60 mb-1";

/** Création d'un stage (brouillon). Entreprises = actives uniquement. */
export function InternshipCreateForm({
  students,
  companies,
  years,
  modules,
}: {
  students: Opt[];
  companies: Opt[];
  years: Opt[];
  modules: Opt[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<FormResult | null, FormData>(
    async (prev, fd) => {
      const r = await createInternship(prev, fd);
      if (r.ok) formRef.current?.reset();
      return r;
    },
    null
  );

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={label}>Étudiant *</label>
          <select name="student_id" required defaultValue="" className={field}>
            <option value="" disabled>
              — Choisir —
            </option>
            {students.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Année académique</label>
          <select name="academic_year" defaultValue="" className={field}>
            <option value="">— Aucune —</option>
            {years.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Entreprise d&apos;accueil *</label>
          <select name="host_company_id" required defaultValue="" className={field}>
            <option value="" disabled>
              — Choisir —
            </option>
            {companies.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {companies.length === 0 && (
            <p className="mt-1 text-xs text-ipmd-red">
              Aucune entreprise active : créez-en une d&apos;abord.
            </p>
          )}
        </div>
        <div>
          <label className={label}>Module (optionnel)</label>
          <select name="module_id" defaultValue="" className={field}>
            <option value="">— Aucun —</option>
            {modules.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={label}>Intitulé du stage *</label>
        <input name="title" required className={field} placeholder="Ex. Stage d'immersion — contrôle de gestion" />
      </div>
      <div>
        <label className={label}>Mission</label>
        <textarea name="mission" rows={2} className={field} placeholder="Objectifs et missions confiées…" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={label}>Début</label>
          <input type="date" name="start_date" className={field} />
        </div>
        <div>
          <label className={label}>Fin</label>
          <input type="date" name="end_date" className={field} />
        </div>
      </div>

      <fieldset className="rounded-lg border border-black/10 p-3">
        <legend className="px-1 text-xs font-semibold text-black/55">
          Maître de stage (entreprise — sans compte IPMD)
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input name="supervisor_name" className={field} placeholder="Nom" />
          <input name="supervisor_function" className={field} placeholder="Fonction" />
          <input name="supervisor_email" className={field} placeholder="Email" />
          <input name="supervisor_phone" className={field} placeholder="Téléphone" />
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-ipmd-red px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "…" : "Créer le stage (brouillon)"}
        </button>
        {state && (
          <p className={`text-xs font-medium ${state.ok ? "text-emerald-600" : "text-ipmd-red"}`}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
