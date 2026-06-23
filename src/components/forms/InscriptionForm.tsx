"use client";

import { useActionState } from "react";
import { submitInscription } from "@/lib/actions";
import { universes } from "@/data/universes";
import { ActionButton } from "@/components/ui/Button";
import { Field, inputBase } from "./FormField";
import { PhoneField } from "./PhoneField";
import type { FormResult } from "@/types";

const entryLevels = ["Bac", "Bac+1", "Bac+2", "Bac+3", "Bac+4", "Bac+5"];

const filieres = [
  "Marketing digital",
  "Communication digitale",
  "Graphisme & Design",
  "E-commerce & commerce international",
  "Développement d'applications",
  "Informatique & intelligence artificielle",
  "Management de projet digital",
  "Comptabilité & finance digitale",
  "Finance digitale",
  "Autre",
];

const diplomas = [
  "Baccalauréat",
  "BTS",
  "DUT",
  "Licence",
  "Bachelor",
  "Master",
  "Doctorat",
  "Autre",
];

// Demande diplômante : uniquement les univers diplômants (les bootcamps
// certifiants ont leur propre formulaire simplifié).
const diplomaUniverses = universes.filter((u) => u.kind === "diplome");

const fileInput =
  "block w-full text-sm text-black/60 file:mr-3 file:rounded-full file:border-0 file:bg-ipmd-light file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ipmd-black";

export function InscriptionForm() {
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

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" htmlFor="email" required>
            <input id="email" name="email" type="email" required autoComplete="email" placeholder="vous@email.com" className={inputBase} />
          </Field>
          <Field label="Profil souhaité" htmlFor="profile" required>
            <select id="profile" name="profile" required defaultValue="" className={inputBase}>
              <option value="">— Sélectionner —</option>
              <option value="etudiant">Étudiant</option>
              <option value="professionnel">Professionnel</option>
              <option value="parent">Parent</option>
              <option value="dirigeant">Dirigeant</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Téléphone" htmlFor="phone" required>
            <PhoneField id="phone" name="phone" required />
          </Field>
          <Field label="WhatsApp (facultatif)" htmlFor="whatsapp">
            <PhoneField id="whatsapp" name="whatsapp" />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Univers visé" htmlFor="universe" required>
            <select id="universe" name="universe" required defaultValue="" className={inputBase}>
              <option value="">— Sélectionner —</option>
              {diplomaUniverses.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.target}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Niveau d'entrée" htmlFor="entryLevel">
            <select id="entryLevel" name="entryLevel" defaultValue="" className={inputBase}>
              <option value="">— Sélectionner —</option>
              {entryLevels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Filière / formation souhaitée" htmlFor="programInterest" required>
            <select id="programInterest" name="programInterest" required defaultValue="" className={inputBase}>
              <option value="">— Sélectionner —</option>
              {filieres.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Dernier diplôme obtenu" htmlFor="lastDiploma">
            <select id="lastDiploma" name="lastDiploma" defaultValue="" className={inputBase}>
              <option value="">— Sélectionner —</option>
              {diplomas.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Dernière formation suivie (facultatif)" htmlFor="lastEducation">
          <input id="lastEducation" name="lastEducation" type="text" placeholder="Ex. Licence 2 informatique" className={inputBase} />
        </Field>

        <fieldset className="rounded-2xl border border-black/10 p-4">
          <legend className="px-2 text-xs font-bold uppercase tracking-wider text-ipmd-red">
            Pièces à joindre — facultatif
          </legend>
          <p className="mb-3 text-xs text-black/50">
            Tu peux les joindre maintenant ou les transmettre plus tard à la
            scolarité. Aucun fichier n&apos;est obligatoire pour envoyer ta demande.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Dernier diplôme" htmlFor="docDiploma">
              <input id="docDiploma" name="docDiploma" type="file" accept=".pdf,.jpg,.jpeg,.png" className={fileInput} />
            </Field>
            <Field label="Bulletins / relevés de notes" htmlFor="docBulletins">
              <input id="docBulletins" name="docBulletins" type="file" accept=".pdf,.jpg,.jpeg,.png" className={fileInput} />
            </Field>
            <Field label="Pièce d'identité / passeport / titre de séjour" htmlFor="docId">
              <input id="docId" name="docId" type="file" accept=".pdf,.jpg,.jpeg,.png" className={fileInput} />
            </Field>
            <Field label="Attestation de scolarité (si nécessaire)" htmlFor="docAttestation">
              <input id="docAttestation" name="docAttestation" type="file" accept=".pdf,.jpg,.jpeg,.png" className={fileInput} />
            </Field>
          </div>
          <p className="mt-2 text-xs text-black/45">Formats acceptés : PDF, JPG, PNG · 8 Mo max par fichier.</p>
        </fieldset>

        <Field label="Message (optionnel)" htmlFor="message">
          <textarea id="message" name="message" rows={4} placeholder="Parlez-nous de votre projet…" className={inputBase} />
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
