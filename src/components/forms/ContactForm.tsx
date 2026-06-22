"use client";

import { useActionState } from "react";
import { submitContact } from "@/lib/actions";
import { ActionButton } from "@/components/ui/Button";
import { Field, inputBase } from "./FormField";
import type { FormResult } from "@/types";

export function ContactForm() {
  const [state, formAction, pending] = useActionState<FormResult | null, FormData>(
    submitContact,
    null
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nom et prénom" htmlFor="c-fullName" required>
          <input
            id="c-fullName"
            name="fullName"
            type="text"
            required
            autoComplete="name"
            placeholder="Votre nom et prénom"
            className={inputBase}
          />
        </Field>
        <Field label="Email" htmlFor="c-email" required>
          <input
            id="c-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="vous@email.com"
            className={inputBase}
          />
        </Field>
      </div>

      <Field label="Sujet" htmlFor="c-subject">
        <input
          id="c-subject"
          name="subject"
          type="text"
          placeholder="Objet de votre message"
          className={inputBase}
        />
      </Field>

      <Field label="Message" htmlFor="c-message" required>
        <textarea
          id="c-message"
          name="message"
          rows={5}
          required
          placeholder="Votre message…"
          className={inputBase}
        />
      </Field>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <ActionButton type="submit" size="lg" disabled={pending}>
          {pending ? "Envoi en cours…" : "Envoyer le message"}
        </ActionButton>
        {state && (
          <p
            role="status"
            className={`text-sm font-medium ${
              state.ok ? "text-green-600" : "text-ipmd-red"
            }`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
