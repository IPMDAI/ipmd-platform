"use client";

import { useActionState } from "react";
import { submitTeacherApplication } from "@/lib/recruitment-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { PhoneField } from "@/components/forms/PhoneField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

export function TeacherApplicationForm() {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    submitTeacherApplication,
    null
  );

  if (state?.ok) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
        <p className="text-3xl">✅</p>
        <p className="mt-3 font-semibold text-ipmd-black">{state.message}</p>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nom et prénom" htmlFor="ta-name" required>
          <input id="ta-name" name="full_name" required className={inputBase} />
        </Field>
        <Field label="Email" htmlFor="ta-email" required>
          <input id="ta-email" name="email" type="email" required className={inputBase} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Téléphone" htmlFor="ta-phone">
          <PhoneField id="ta-phone" name="phone" />
        </Field>
        <Field label="Matière / domaine" htmlFor="ta-subject">
          <input
            id="ta-subject"
            name="subject"
            placeholder="Ex. Marketing digital, Développement…"
            className={inputBase}
          />
        </Field>
      </div>
      <Field label="Disponibilités" htmlFor="ta-avail">
        <input
          id="ta-avail"
          name="availability"
          placeholder="Ex. Soirs en semaine, samedis…"
          className={inputBase}
        />
      </Field>

      <Field label="Syllabus proposé (le cours que vous donneriez)" htmlFor="ta-syllabus">
        <textarea
          id="ta-syllabus"
          name="syllabus"
          rows={5}
          placeholder="Décrivez votre programme, axé pratique (modules, projets, compétences visées…)"
          className={inputBase}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Lien CV" htmlFor="ta-cv">
          <input id="ta-cv" name="cv_url" placeholder="https://…" className={inputBase} />
        </Field>
        <Field label="Lien diplômes" htmlFor="ta-dip">
          <input id="ta-dip" name="diploma_url" placeholder="https://…" className={inputBase} />
        </Field>
        <Field label="Lien autorisation" htmlFor="ta-auth">
          <input id="ta-auth" name="authorization_url" placeholder="https://…" className={inputBase} />
        </Field>
      </div>

      <Field label="Message (optionnel)" htmlFor="ta-msg">
        <textarea id="ta-msg" name="message" rows={3} className={inputBase} />
      </Field>

      <ActionButton type="submit" size="lg" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer ma candidature"}
      </ActionButton>

      {state && !state.ok && (
        <p className="text-sm font-medium text-ipmd-red">{state.message}</p>
      )}
    </form>
  );
}
