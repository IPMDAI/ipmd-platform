"use client";

import { useActionState } from "react";
import { submitInscription } from "@/lib/actions";
import { universes } from "@/data/universes";
import { ActionButton } from "@/components/ui/Button";
import { Field, inputBase } from "./FormField";
import { PhoneField } from "./PhoneField";
import type { FormResult } from "@/types";

// Bootcamps certifiants : formulaire simplifié (pas de dossier diplôme).
const certificateUniverses = universes.filter((u) => u.kind === "certificat");

export function BootcampInscriptionForm({
  defaultUniverse = "",
}: {
  defaultUniverse?: string;
}) {
  const [state, formAction, pending] = useActionState<FormResult | null, FormData>(
    submitInscription,
    null
  );

  return (
    <>
      <form action={formAction} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nom" htmlFor="lastName" required>
            <input id="lastName" name="lastName" type="text" required autoComplete="family-name" placeholder="Votre nom" className={inputBase} />
          </Field>
          <Field label="Prénoms" htmlFor="firstName" required>
            <input id="firstName" name="firstName" type="text" required autoComplete="given-name" placeholder="Vos prénoms" className={inputBase} />
          </Field>
        </div>

        <Field label="Email" htmlFor="email" required>
          <input id="email" name="email" type="email" required autoComplete="email" placeholder="vous@email.com" className={inputBase} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Téléphone" htmlFor="phone" required>
            <PhoneField id="phone" name="phone" required />
          </Field>
          <Field label="WhatsApp (facultatif)" htmlFor="whatsapp">
            <PhoneField id="whatsapp" name="whatsapp" />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Programme" htmlFor="universe" required>
            <select id="universe" name="universe" required defaultValue={defaultUniverse} className={inputBase}>
              <option value="">— Sélectionner —</option>
              {certificateUniverses.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.target}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Bootcamp souhaité" htmlFor="programInterest" required>
            <input id="programInterest" name="programInterest" type="text" required placeholder="Ex. IA générative, Community management…" className={inputBase} />
          </Field>
        </div>

        <Field label="Message (optionnel)" htmlFor="message">
          <textarea id="message" name="message" rows={3} placeholder="Parlez-nous de votre objectif…" className={inputBase} />
        </Field>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ActionButton type="submit" size="lg" disabled={pending}>
            {pending ? "Envoi en cours…" : "Envoyer ma demande"}
          </ActionButton>
          {state && !state.ok && (
            <p
              role="status"
              className={`text-sm font-medium ${
                state.code === "duplicate" ? "text-amber-600" : "text-ipmd-red"
              }`}
            >
              {state.message}
            </p>
          )}
        </div>
      </form>

      {state?.ok && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-md rounded-2xl bg-white p-7 text-center shadow-2xl">
            <div className="text-4xl">🎉</div>
            <h3 className="mt-3 text-xl font-extrabold text-ipmd-black">Demande reçue !</h3>
            <p className="mt-2 text-sm leading-relaxed text-black/70">{state.message}</p>
            <a
              href="/"
              className="mt-6 inline-block rounded-full bg-ipmd-red px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Retour à l&apos;accueil
            </a>
          </div>
        </div>
      )}
    </>
  );
}
