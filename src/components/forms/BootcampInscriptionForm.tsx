"use client";

import { useState, type FormEvent } from "react";
import { submitInscription } from "@/lib/actions";
import { createClient } from "@/lib/supabase/client";
import { universes } from "@/data/universes";
import { ActionButton } from "@/components/ui/Button";
import { Field, inputBase } from "./FormField";
import { PhoneField } from "./PhoneField";
import type { FormResult } from "@/types";

const MAX_FILE = 8 * 1024 * 1024;

// Bootcamps certifiants : formulaire simplifié (pas de dossier diplôme).
const certificateUniverses = universes.filter((u) => u.kind === "certificat");

const fileInput =
  "block w-full cursor-pointer rounded-xl border border-dashed border-black/25 bg-white px-3 py-3 text-sm text-black/55 shadow-sm transition-colors hover:border-ipmd-red/50 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-ipmd-red file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white";

/** Uploade un fichier vers Storage (navigateur). Renvoie le chemin ou null. */
async function uploadDoc(
  supabase: NonNullable<ReturnType<typeof createClient>>,
  folder: string,
  key: string,
  file: File | undefined | null
): Promise<string | null> {
  if (!file || file.size === 0 || file.size > MAX_FILE) return null;
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${folder}/${key}.${ext}`;
  const { error } = await supabase.storage
    .from("candidature-docs")
    .upload(path, file, { upsert: true });
  return error ? null : path;
}

export function BootcampInscriptionForm({
  defaultUniverse = "",
}: {
  defaultUniverse?: string;
}) {
  const [state, setState] = useState<FormResult | null>(null);
  const [pending, setPending] = useState(false);
  const [universe, setUniverse] = useState(defaultUniverse);

  // CV : facultatif pour UltraJobs, obligatoire pour les autres bootcamps.
  const cvRequired = universe !== "" && universe !== "ultrajobs";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setState(null);

    const q = (sel: string) =>
      (form.querySelector(sel) as HTMLInputElement | null)?.files?.[0] ?? null;

    // Validation : CV obligatoire (sauf UltraJobs), pièce d'identité obligatoire.
    if (cvRequired && !q("#docCv")) {
      setState({ ok: false, message: "Le CV est obligatoire pour ce bootcamp." });
      return;
    }
    if (!q("#docId")) {
      setState({ ok: false, message: "La pièce d'identité est obligatoire." });
      return;
    }

    setPending(true);
    try {
      const fd = new FormData(form);
      fd.delete("docCv");
      fd.delete("docId");

      const supabase = createClient();
      if (supabase) {
        const folder = crypto.randomUUID();
        const [cv, idf] = await Promise.all([
          uploadDoc(supabase, folder, "cv", q("#docCv")),
          uploadDoc(supabase, folder, "piece-identite", q("#docId")),
        ]);
        if (cv) fd.set("docCvPath", cv);
        if (idf) fd.set("docIdPath", idf);
      }

      const res = await submitInscription(null, fd);
      setState(res);
      if (res.ok) {
        form.reset();
        setUniverse(defaultUniverse);
      }
    } catch {
      setState({
        ok: false,
        message: "Erreur lors de l'envoi des pièces. Vérifie leur taille (8 Mo max) et réessaie.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
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
            <select
              id="universe"
              name="universe"
              required
              value={universe}
              onChange={(e) => setUniverse(e.target.value)}
              className={inputBase}
            >
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

        <fieldset className="rounded-2xl border border-black/10 p-4">
          <legend className="px-2 text-xs font-bold uppercase tracking-wider text-ipmd-red">
            Pièces à joindre
          </legend>
          <p className="mb-3 text-xs text-black/50">
            La <strong>pièce d&apos;identité</strong> est requise.{" "}
            {cvRequired ? (
              <>Le <strong>CV</strong> est requis pour ce bootcamp.</>
            ) : (
              <>Le <strong>CV</strong> est facultatif pour UltraJobs.</>
            )}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={cvRequired ? "CV" : "CV (facultatif)"} htmlFor="docCv" required={cvRequired}>
              <input id="docCv" name="docCv" type="file" required={cvRequired} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className={fileInput} />
            </Field>
            <Field label="Pièce d'identité / passeport" htmlFor="docId" required>
              <input id="docId" name="docId" type="file" required accept=".pdf,.jpg,.jpeg,.png" className={fileInput} />
            </Field>
          </div>
          <p className="mt-2 text-xs text-black/45">Formats acceptés : PDF, JPG, PNG (CV : Word accepté) · 8 Mo max par fichier.</p>
        </fieldset>

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
