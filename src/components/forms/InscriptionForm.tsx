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
    <>
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

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Dernière formation suivie" htmlFor="lastEducation">
          <input
            id="lastEducation"
            name="lastEducation"
            type="text"
            placeholder="Ex. Licence 2 informatique"
            className={inputBase}
          />
        </Field>
        <Field label="Dernier diplôme obtenu" htmlFor="lastDiploma">
          <input
            id="lastDiploma"
            name="lastDiploma"
            type="text"
            placeholder="Ex. Baccalauréat, BTS…"
            className={inputBase}
          />
        </Field>
      </div>

      <fieldset className="rounded-2xl border border-black/10 p-4">
        <legend className="px-2 text-xs font-bold uppercase tracking-wider text-ipmd-red">
          Pièces à joindre (PDF ou image)
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Dernier diplôme" htmlFor="docDiploma">
            <input id="docDiploma" name="docDiploma" type="file" accept=".pdf,.jpg,.jpeg,.png" className="block w-full text-sm text-black/60 file:mr-3 file:rounded-full file:border-0 file:bg-ipmd-light file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ipmd-black" />
          </Field>
          <Field label="Bulletins / relevés de notes" htmlFor="docBulletins">
            <input id="docBulletins" name="docBulletins" type="file" accept=".pdf,.jpg,.jpeg,.png" className="block w-full text-sm text-black/60 file:mr-3 file:rounded-full file:border-0 file:bg-ipmd-light file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ipmd-black" />
          </Field>
          <Field label="Pièce d'identité / passeport / titre de séjour" htmlFor="docId">
            <input id="docId" name="docId" type="file" accept=".pdf,.jpg,.jpeg,.png" className="block w-full text-sm text-black/60 file:mr-3 file:rounded-full file:border-0 file:bg-ipmd-light file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ipmd-black" />
          </Field>
          <Field label="Attestation de scolarité (si nécessaire)" htmlFor="docAttestation">
            <input id="docAttestation" name="docAttestation" type="file" accept=".pdf,.jpg,.jpeg,.png" className="block w-full text-sm text-black/60 file:mr-3 file:rounded-full file:border-0 file:bg-ipmd-light file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ipmd-black" />
          </Field>
        </div>
        <p className="mt-2 text-xs text-black/45">Formats acceptés : PDF, JPG, PNG · 8 Mo max par fichier.</p>
      </fieldset>

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
          <h3 className="mt-3 text-xl font-extrabold text-ipmd-black">
            Demande reçue !
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-black/70">
            {state.message}
          </p>
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
