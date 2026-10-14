"use client";

import { useActionState, useRef } from "react";
import { createAcademicWork } from "@/lib/academic-work-actions";
import { WORK_TYPES } from "@/lib/academic-works";
import type { FormResult } from "@/types";

export type Opt = { value: string; label: string };

const field =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-ipmd-red focus:ring-2 focus:ring-ipmd-red/20";
const label = "block text-xs font-semibold text-black/60 mb-1";

/** Création d'un travail (mémoire / rapport de stage / PFE) via RPC. */
export function AcademicWorkCreateForm({
  students,
  years,
  internships,
}: {
  students: Opt[];
  years: Opt[];
  internships: Opt[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<FormResult | null, FormData>(
    async (prev, fd) => {
      const r = await createAcademicWork(prev, fd);
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
            <option value="" disabled>— Choisir —</option>
            {students.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Type *</label>
          <select name="work_type" required defaultValue="" className={field}>
            <option value="" disabled>— Choisir —</option>
            {WORK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Année académique *</label>
          <select name="academic_year" required defaultValue="" className={field}>
            <option value="" disabled>— Choisir —</option>
            {years.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Stage associé (optionnel)</label>
          <select name="internship_id" defaultValue="" className={field}>
            <option value="">— Aucun —</option>
            {internships.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-black/45">
            Le stage doit appartenir à l&apos;étudiant choisi (vérifié en base).
          </p>
        </div>
      </div>
      <div>
        <label className={label}>Titre / sujet *</label>
        <input name="title" required className={field} placeholder="Intitulé du mémoire / rapport / PFE" />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-ipmd-red px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "…" : "Créer le travail"}
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
