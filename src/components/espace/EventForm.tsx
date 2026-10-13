"use client";

import { useActionState } from "react";
import { createEvent } from "@/lib/event-actions";
import { EVENT_KINDS, EVENT_AUDIENCES } from "@/lib/events";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

export function EventForm() {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    createEvent,
    null
  );

  return (
    <form
      action={action}
      className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="text-lg font-bold text-ipmd-black">Nouvel événement</h2>

      <Field label="Titre" htmlFor="e-title" required>
        <input id="e-title" name="title" required placeholder="Ex. Journée Portes Ouvertes" className={inputBase} />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Type" htmlFor="e-kind">
          <select id="e-kind" name="kind" defaultValue="autre" className={inputBase}>
            {EVENT_KINDS.map((k) => (
              <option key={k.value} value={k.value}>{k.icon} {k.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Audience" htmlFor="e-aud">
          <select id="e-aud" name="audience" defaultValue="all" className={inputBase}>
            {EVENT_AUDIENCES.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Début" htmlFor="e-start" required>
          <input id="e-start" name="starts_at" type="datetime-local" required className={inputBase} />
        </Field>
        <Field label="Fin (optionnel)" htmlFor="e-end">
          <input id="e-end" name="ends_at" type="datetime-local" className={inputBase} />
        </Field>
      </div>

      <Field label="Lieu" htmlFor="e-loc">
        <input id="e-loc" name="location" placeholder="Ex. Campus IPMD, Cocody" className={inputBase} />
      </Field>
      <Field label="Description" htmlFor="e-desc">
        <textarea id="e-desc" name="description" rows={3} className={inputBase} />
      </Field>

      <label className="flex items-center gap-2 text-sm text-ipmd-black">
        <input type="checkbox" name="published" className="h-4 w-4 rounded border-black/20 text-ipmd-red" />
        Publier immédiatement
      </label>

      <ActionButton type="submit" disabled={pending}>
        {pending ? "Création…" : "Créer l'événement"}
      </ActionButton>
      {state && (
        <p className={`text-sm font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
