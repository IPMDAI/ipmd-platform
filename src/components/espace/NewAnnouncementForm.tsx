"use client";

import { useActionState, useEffect, useRef } from "react";
import { createAnnouncement } from "@/lib/announcement-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import { AUDIENCES } from "@/lib/announcements";
import type { FormResult } from "@/types";

export function NewAnnouncementForm() {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    createAnnouncement,
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
      <h2 className="text-lg font-bold text-ipmd-black">Nouvelle annonce</h2>
      <Field label="Titre" htmlFor="a-title" required>
        <input
          id="a-title"
          name="title"
          required
          placeholder="Ex. Fermeture exceptionnelle vendredi"
          className={inputBase}
        />
      </Field>
      <Field label="Message" htmlFor="a-body" required>
        <textarea
          id="a-body"
          name="body"
          required
          rows={4}
          placeholder="Votre message…"
          className={inputBase}
        />
      </Field>
      <Field label="Destinataires" htmlFor="a-audience">
        <select id="a-audience" name="audience" defaultValue="all" className={inputBase}>
          {AUDIENCES.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </Field>
      <ActionButton type="submit" disabled={pending}>
        {pending ? "Publication…" : "Publier l'annonce"}
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
