"use client";

import { useActionState } from "react";
import {
  addCalendarMilestone,
  updateCalendarMilestone,
} from "@/lib/calendar-actions";
import { inputBase } from "@/components/forms/FormField";
import { CALENDAR_KINDS } from "@/lib/schedule";
import { NIVEAUX } from "@/lib/referentiel";
import type { FormResult } from "@/types";

export type Milestone = {
  id: string;
  academic_year: string;
  kind: string;
  label: string;
  start_date: string;
  end_date: string;
  level: string | null;
  blocks_regular: boolean;
  blocks_all: boolean;
};

export function MilestoneForm({
  year,
  milestone,
}: {
  year: string;
  milestone?: Milestone;
}) {
  const editing = Boolean(milestone);
  const bound = editing
    ? updateCalendarMilestone.bind(null, milestone!.id)
    : addCalendarMilestone;
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );

  return (
    <form action={action} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <input type="hidden" name="academic_year" value={milestone?.academic_year ?? year} />
      {!editing && <h3 className="text-sm font-bold text-ipmd-black">Nouveau jalon — {year}</h3>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-[11px] font-semibold text-black/55">
          Type
          <select name="kind" defaultValue={milestone?.kind ?? ""} required className={`${inputBase} mt-1 py-1.5 text-sm`}>
            <option value="" disabled>— Choisir —</option>
            {CALENDAR_KINDS.map((k) => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>
        </label>
        <label className="text-[11px] font-semibold text-black/55">
          Niveau concerné (optionnel)
          <select name="level" defaultValue={milestone?.level ?? ""} className={`${inputBase} mt-1 py-1.5 text-sm`}>
            <option value="">— Tous —</option>
            {NIVEAUX.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      <label className="block text-[11px] font-semibold text-black/55">
        Intitulé
        <input name="label" defaultValue={milestone?.label ?? ""} required placeholder="Ex. Examens écrits S1" className={`${inputBase} mt-1 py-1.5 text-sm`} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-[11px] font-semibold text-black/55">
          Début
          <input name="start_date" type="date" defaultValue={milestone?.start_date ?? ""} required className={`${inputBase} mt-1 py-1.5 text-sm`} />
        </label>
        <label className="text-[11px] font-semibold text-black/55">
          Fin
          <input name="end_date" type="date" defaultValue={milestone?.end_date ?? ""} required className={`${inputBase} mt-1 py-1.5 text-sm`} />
        </label>
      </div>

      <div className="flex flex-wrap gap-4 text-[11px] font-semibold text-black/60">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" name="blocks_regular" defaultChecked={milestone?.blocks_regular ?? false} />
          Suspend les cours réguliers (examens)
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" name="blocks_all" defaultChecked={milestone?.blocks_all ?? false} />
          Fermeture totale (vacances/férié)
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ipmd-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "…" : editing ? "Enregistrer" : "Ajouter le jalon"}
      </button>
      {state && (
        <p className={`text-xs font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
