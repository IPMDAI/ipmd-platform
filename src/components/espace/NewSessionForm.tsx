"use client";

import { useActionState, useEffect, useRef } from "react";
import { createSession } from "@/lib/teaching-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import { DAY_OPTIONS } from "@/lib/schedule";
import type { FormResult } from "@/types";

export function NewSessionForm({ courseId }: { courseId: string }) {
  const bound = createSession.bind(null, courseId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="text-lg font-bold text-ipmd-black">Nouvelle séance</h2>

      <Field label="Jour" htmlFor="s-day" required>
        <select id="s-day" name="day_of_week" required className={inputBase}>
          {DAY_OPTIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Début" htmlFor="s-start" required>
          <input
            id="s-start"
            name="start_time"
            type="time"
            required
            className={inputBase}
          />
        </Field>
        <Field label="Fin" htmlFor="s-end" required>
          <input
            id="s-end"
            name="end_time"
            type="time"
            required
            className={inputBase}
          />
        </Field>
      </div>

      <Field label="Salle (optionnel)" htmlFor="s-room">
        <input
          id="s-room"
          name="room"
          placeholder="Ex. Salle A2"
          className={inputBase}
        />
      </Field>

      <ActionButton type="submit" disabled={pending}>
        {pending ? "Ajout…" : "Ajouter la séance"}
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
