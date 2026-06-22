"use client";

import { useActionState, useEffect, useRef } from "react";
import { createLesson } from "@/lib/attendance-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

export function NewLessonForm({ courseId }: { courseId: string }) {
  const bound = createLesson.bind(null, courseId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form
      ref={ref}
      action={action}
      className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="text-lg font-bold text-ipmd-black">Nouvelle séance</h2>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" htmlFor="l-date" required>
          <input id="l-date" name="lesson_date" type="date" required className={inputBase} />
        </Field>
        <Field label="Heures" htmlFor="l-hours">
          <input
            id="l-hours"
            name="hours"
            type="number"
            step="0.5"
            min="0"
            placeholder="2"
            className={inputBase}
          />
        </Field>
      </div>

      <Field label="Thème / module" htmlFor="l-theme">
        <input
          id="l-theme"
          name="theme"
          placeholder="Ex. Publicité Meta Ads"
          className={inputBase}
        />
      </Field>

      <Field label="Documents, vidéos, liens" htmlFor="l-res">
        <textarea
          id="l-res"
          name="resources"
          rows={3}
          placeholder="Supports distribués, liens de vidéos, ressources…"
          className={inputBase}
        />
      </Field>

      <ActionButton type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer la séance"}
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
