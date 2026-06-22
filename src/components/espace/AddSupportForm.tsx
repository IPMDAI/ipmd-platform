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
      <Field label="Fichier (PDF, PowerPoint…)" htmlFor="s-file">
        <input
          id="s-file"
          name="file"
          type="file"
          accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.zip,image/*"
          className="block w-full text-sm text-black/70 file:mr-3 file:rounded-lg file:border-0 file:bg-ipmd-black file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:opacity-90"
        />
      </Field>
      <Field label="…ou un lien" htmlFor="s-url">
        <input
          id="s-url"
          name="url"
          placeholder="https://…"
          className={inputBase}
        />
      </Field>
      <ActionButton type="submit" disabled={pending}>
        {pending ? "Envoi…" : "Ajouter le support"}
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
