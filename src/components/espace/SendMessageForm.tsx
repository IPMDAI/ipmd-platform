"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendInternalMessage } from "@/lib/messaging-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import { MESSAGE_CATEGORIES } from "@/lib/messaging";
import type { FormResult } from "@/types";

export function SendMessageForm() {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    sendInternalMessage,
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
      <h2 className="text-lg font-bold text-ipmd-black">
        Écrire à l&apos;administration
      </h2>
      <Field label="Motif" htmlFor="m-cat">
        <select id="m-cat" name="category" defaultValue="question" className={inputBase}>
          {MESSAGE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Objet" htmlFor="m-subject" required>
        <input
          id="m-subject"
          name="subject"
          required
          placeholder="Ex. Absence du 20 juin"
          className={inputBase}
        />
      </Field>
      <Field label="Message" htmlFor="m-body" required>
        <textarea
          id="m-body"
          name="body"
          required
          rows={4}
          placeholder="Votre message…"
          className={inputBase}
        />
      </Field>
      <ActionButton type="submit" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer"}
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
