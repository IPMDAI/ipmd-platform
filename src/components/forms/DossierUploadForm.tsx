"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { createUploadTicket } from "@/lib/upload-actions";
import { completeDossier } from "@/lib/dossier-actions";
import { ActionButton } from "@/components/ui/Button";
import { Field } from "./FormField";
import type { DocKey } from "@/lib/candidate-docs";
import type { FormResult } from "@/types";

const MAX_FILE = 15 * 1024 * 1024;

type UploadReason = "ok" | "vide" | "trop-lourd" | "echec";
type UploadResult = { path: string | null; reason: UploadReason };

export type DossierDocField = { key: DocKey; label: string; required: boolean; provided: boolean };

async function uploadDoc(
  supabase: NonNullable<ReturnType<typeof createClient>>,
  folder: string,
  key: string,
  file: File | undefined | null
): Promise<UploadResult> {
  if (!file || file.size === 0) return { path: null, reason: "vide" };
  if (file.size > MAX_FILE) return { path: null, reason: "trop-lourd" };
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${folder}/${key}.${ext}`;
  const token = await createUploadTicket(path);
  if (!token) return { path: null, reason: "echec" };
  const { error } = await supabase.storage
    .from("candidature-docs")
    .uploadToSignedUrl(path, token, file, { upsert: true });
  return error ? { path: null, reason: "echec" } : { path, reason: "ok" };
}

const fileInput =
  "block w-full cursor-pointer rounded-xl border border-dashed border-black/25 bg-white px-3 py-3 text-sm text-black/55 shadow-sm transition-colors hover:border-ipmd-red/50 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-ipmd-red file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white";

/**
 * Formulaire public « Compléter mon dossier » : un champ par pièce DEMANDÉE.
 * Les pièces déjà fournies sont optionnelles (remplacement) ; les manquantes
 * requises. Upload direct vers le bucket candidature-docs, puis chemins transmis
 * à l'action serveur (jeton vérifié côté serveur : signature + expiration + révocation).
 */
export function DossierUploadForm({
  token,
  docs,
}: {
  token: string;
  docs: DossierDocField[];
}) {
  const [state, setState] = useState<FormResult | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setState(null);
    setPending(true);
    try {
      const supabase = createClient();
      if (!supabase) {
        setState({ ok: false, message: "Service indisponible. Réessayez plus tard." });
        setPending(false);
        return;
      }

      const folder = crypto.randomUUID();
      const fd = new FormData();
      fd.set("token", token);
      const problems: string[] = [];

      for (const d of docs) {
        const input = form.querySelector(`#doc_${d.key}`) as HTMLInputElement | null;
        const file = input?.files?.[0] ?? null;
        if (!file || file.size === 0) {
          // Requis manquant → problème ; remplacement non fourni → simplement ignoré.
          if (d.required) problems.push(`${d.label} est manquant`);
          continue;
        }
        const r = await uploadDoc(supabase, folder, d.key, file);
        if (r.reason === "trop-lourd") problems.push(`${d.label} dépasse 15 Mo`);
        else if (r.reason === "echec") problems.push(`${d.label} n'a pas pu être envoyé`);
        else if (r.path) fd.set(`path_${d.key}`, r.path);
      }

      if (problems.length > 0) {
        setState({
          ok: false,
          message: `Impossible d'envoyer : ${problems.join(
            ", "
          )}. Vérifiez le format (PDF, JPG ou PNG) et la taille (15 Mo max), puis réessayez.`,
        });
        setPending(false);
        return;
      }

      const res = await completeDossier(null, fd);
      setState(res);
      if (res.ok) setDone(true);
    } catch {
      setState({
        ok: false,
        message:
          "Erreur lors de l'envoi des pièces. Vérifiez leur taille (15 Mo max) et réessayez.",
      });
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-green-50 p-6 text-center ring-1 ring-green-200">
        <p className="text-3xl">✅</p>
        <p className="mt-2 font-bold text-green-800">Dossier transmis</p>
        <p className="mt-1 text-sm text-green-700">
          {state?.message ?? "Merci ! Vos pièces ont bien été transmises à l'IPMD."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {docs.map((d) => (
        <Field
          key={d.key}
          label={`${d.label}${d.provided ? " (déjà fourni — remplacer)" : ""}`}
          htmlFor={`doc_${d.key}`}
          required={d.required}
        >
          <input
            id={`doc_${d.key}`}
            name={`doc_${d.key}`}
            type="file"
            required={d.required}
            accept=".pdf,.jpg,.jpeg,.png"
            className={fileInput}
          />
        </Field>
      ))}

      <p className="text-xs text-black/45">
        Formats acceptés : PDF, JPG, PNG · 15 Mo max par fichier.
      </p>

      {state && !state.ok && (
        <p className="rounded-xl bg-ipmd-red/10 px-4 py-3 text-sm font-medium text-ipmd-red">
          {state.message}
        </p>
      )}

      <ActionButton type="submit" disabled={pending}>
        {pending ? "Envoi en cours…" : "Envoyer mes pièces"}
      </ActionButton>
    </form>
  );
}
