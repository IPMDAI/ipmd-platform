"use client";

import { useActionState } from "react";
import { submitInscription } from "@/lib/actions";
import { universes } from "@/data/universes";
import { ActionButton } from "@/components/ui/Button";
import { Field, inputBase } from "./FormField";
import { PhoneField } from "./PhoneField";
import type { FormResult } from "@/types";

const entryLevels = ["Bac", "Bac+1", "Bac+2", "Bac+3", "Bac+4", "Bac+5"];

export function InscriptionForm() {
  const [state, formAction, pending] = useActionState<FormResult | null, FormData>(
    submitInscription,
    null
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nom et prénom" htmlFor="fullName" required>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            autoComplete="name"
            placeholder="Votre nom et prénom"
            className={inputBase}
          />
        </Field>
        <Field label="Email" htmlFor="email" required>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="vous@email.com"
            className={inputBase}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Téléphone" htmlFor="phone" required>
          <PhoneField id="phone" name="phone" required />
        </Field>
        <Field label="Profil souhaité" htmlFor="profile" required>
          <select id="profile" name="profile" required className={inputBase}>
            <option value="">— Sélectionner —</option>
            <option value="etudiant">Étudiant</option>
            <option value="professionnel">Professionnel</option>
            <option value="parent">Parent</option>
            <option value="dirigeant">Dirigeant</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Univers visé" htmlFor="universe" required>
          <select id="universe" name="universe" required className={inputBase}>
            <option value="">— Sélectionner —</option>
            {universes.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Niveau d'entrée" htmlFor="entryLevel">
          <select id="entryLevel" name="entryLevel" className={inputBase}>
            <option value="">— Sélectionner —</option>
            {entryLevels.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Formation souhaitée" htmlFor="programInterest">
        <input
          id="programInterest"
          name="programInterest"
          type="text"
          placeholder="Ex. Marketing digital, Développement…"
          className={inputBase}
        />
      </Field>

      <Field label="Message (optionnel)" htmlFor="message">
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Parlez-nous de votre projet…"
          className={inputBase}
        />
      </Field>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <ActionButton type="submit" size="lg" disabled={pending}>
          {pending ? "Envoi en cours…" : "Envoyer ma demande"}
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
