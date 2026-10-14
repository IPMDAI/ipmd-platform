"use client";

import { useActionState, useRef } from "react";
import { createDefense } from "@/lib/defense-actions";
import type { FormResult } from "@/types";

export type Opt = { value: string; label: string };

const field =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-ipmd-red focus:ring-2 focus:ring-ipmd-red/20";

/** Création d'une soutenance à partir d'un travail VALIDE (la RPC garde la règle). */
export function DefenseCreateForm({ works }: { works: Opt[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<FormResult | null, FormData>(
    async (prev, fd) => {
      const r = await createDefense(prev, fd);
      if (r.ok) formRef.current?.reset();
      return r;
    },
    null
  );

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-semibold text-black/60">
          Travail soutenable (validé) *
        </label>
        <select name="work_id" required defaultValue="" className={field}>
          <option value="" disabled>— Choisir un travail validé —</option>
          {works.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {works.length === 0 && (
          <p className="mt-1 text-xs text-black/45">Aucun travail validé disponible.</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-lg bg-ipmd-red px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "…" : "Créer la soutenance"}
        </button>
        {state && (
          <p className={`text-xs font-medium ${state.ok ? "text-emerald-600" : "text-ipmd-red"}`}>{state.message}</p>
        )}
      </div>
    </form>
  );
}
