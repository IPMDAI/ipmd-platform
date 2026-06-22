"use client";

import { useActionState, useEffect, useRef } from "react";
import { createCourse } from "@/lib/teaching-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

export function NewCourseForm() {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    createCourse,
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
      <h2 className="text-lg font-bold text-ipmd-black">Nouveau cours</h2>

      <Field label="Titre du cours" htmlFor="title" required>
        <input
          id="title"
          name="title"
          required
          placeholder="Ex. Marketing digital — Licence 1"
          className={inputBase}
        />
      </Field>

      <Field label="Domaine (optionnel)" htmlFor="field">
        <input
          id="field"
          name="field"
          placeholder="Ex. Marketing"
          className={inputBase}
        />
      </Field>

      <Field label="Description (optionnel)" htmlFor="description">
        <textarea
          id="description"
          name="description"
          rows={2}
          placeholder="Objectif et contenu du cours…"
          className={inputBase}
        />
      </Field>

      <ActionButton type="submit" disabled={pending}>
        {pending ? "Création…" : "Créer le cours"}
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
