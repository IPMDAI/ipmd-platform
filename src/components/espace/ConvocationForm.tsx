"use client";

import { useActionState } from "react";
import { createConvocation } from "@/lib/convocation-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

type Student = { id: string; full_name: string | null; email: string };

export function ConvocationForm({ students }: { students: Student[] }) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    createConvocation,
    null
  );

  return (
    <form
      action={action}
      className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="text-lg font-bold text-ipmd-black">Nouvelle convocation</h2>

      <Field label="Étudiant" htmlFor="c-student" required>
        <select id="c-student" name="student_id" required defaultValue="" className={inputBase}>
          <option value="" disabled>
            — Choisir —
          </option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name || s.email} ({s.email})
            </option>
          ))}
        </select>
      </Field>

      <Field label="Objet" htmlFor="c-title" required>
        <input
          id="c-title"
          name="title"
          required
          placeholder="Ex. Entretien pédagogique"
          className={inputBase}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Date & heure" htmlFor="c-when">
          <input id="c-when" name="scheduled_at" type="datetime-local" className={inputBase} />
        </Field>
        <Field label="Lieu" htmlFor="c-loc">
          <input
            id="c-loc"
            name="location"
            placeholder="Ex. Bureau de la Scolarité"
            className={inputBase}
          />
        </Field>
      </div>

      <Field label="Motif / détails" htmlFor="c-reason">
        <textarea id="c-reason" name="reason" rows={3} className={inputBase} />
      </Field>

      <ActionButton type="submit" disabled={pending}>
        {pending ? "Envoi…" : "Créer & notifier"}
      </ActionButton>
      {state && (
        <p
          className={`text-sm font-medium ${
            state.ok ? "text-green-600" : "text-ipmd-red"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
