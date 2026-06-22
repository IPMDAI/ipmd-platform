"use client";

import { useActionState, useEffect, useRef } from "react";
import { createAssignment } from "@/lib/teaching-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

export function NewAssignmentForm({ courseId }: { courseId: string }) {
  // Lie l'id du cours à l'action serveur.
  const bound = createAssignment.bind(null, courseId);
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
      <h2 className="text-lg font-bold text-ipmd-black">Nouveau devoir</h2>

      <Field label="Titre du devoir" htmlFor="a-title" required>
        <input
          id="a-title"
          name="title"
          required
          placeholder="Ex. Analyse d'une campagne Meta Ads"
          className={inputBase}
        />
      </Field>

      <Field label="Consignes (optionnel)" htmlFor="a-description">
        <textarea
          id="a-description"
          name="description"
          rows={2}
          placeholder="Ce qui est attendu…"
          className={inputBase}
        />
      </Field>

      <Field label="Date limite (optionnel)" htmlFor="a-due">
        <input
          id="a-due"
          name="due_date"
          type="date"
          className={inputBase}
        />
      </Field>

      <ActionButton type="submit" disabled={pending}>
        {pending ? "Ajout…" : "Ajouter le devoir"}
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
