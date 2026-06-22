"use client";

import { useActionState, useEffect, useRef } from "react";
import { addModuleSupport } from "@/lib/module-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

export function AddSupportForm({ moduleId }: { moduleId: string }) {
  const bound = addModuleSupport.bind(null, moduleId);
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
      className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="text-lg font-bold text-ipmd-black">Nouveau support</h2>
      <Field label="Titre" htmlFor="s-label" required>
        <input
          id="s-label"
          name="label"
          required
          placeholder="Ex. Slides cours 1, Vidéo intro…"
          className={inputBase}
        />
      </Field>
      <Field label="Lien (optionnel)" htmlFor="s-url">
        <input
          id="s-url"
          name="url"
          placeholder="https://…"
          className={inputBase}
        />
      </Field>
      <ActionButton type="submit" disabled={pending}>
        {pending ? "…" : "Ajouter le support"}
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
