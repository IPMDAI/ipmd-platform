"use client";

import { useActionState, useEffect, useRef } from "react";
import { postClassAnnouncement } from "@/lib/classroom-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

export function PostClassForm({
  classes,
}: {
  classes: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    postClassAnnouncement,
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
      <h2 className="text-lg font-bold text-ipmd-black">Annoncer à une classe</h2>
      <Field label="Classe" htmlFor="c-class" required>
        <select id="c-class" name="class_id" required defaultValue="" className={inputBase}>
          <option value="" disabled>
            — Choisir —
          </option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Titre (optionnel)" htmlFor="c-title">
        <input
          id="c-title"
          name="title"
          placeholder="Ex. Devoir à rendre"
          className={inputBase}
        />
      </Field>
      <Field label="Message" htmlFor="c-body" required>
        <textarea
          id="c-body"
          name="body"
          required
          rows={3}
          placeholder="Votre message à la classe…"
          className={inputBase}
        />
      </Field>
      <ActionButton type="submit" disabled={pending}>
        {pending ? "Publication…" : "Publier"}
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
