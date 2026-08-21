"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { createUploadTicket } from "@/lib/upload-actions";
import { completeDossier } from "@/lib/dossier-actions";
import { ActionButton } from "@/components/ui/Button";
import { Field } from "./FormField";
import type { FormResult } from "@/types";

const MAX_FILE = 15 * 1024 * 1024;

type UploadReason = "ok" | "vide" | "trop-lourd" | "echec";
type UploadResult = { path: string | null; reason: UploadReason };

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
  // Ticket d'upload signé (serveur, clé service_role) → envoi direct au stockage,
  // contourne la RLS sans faire transiter le fichier par le serveur.
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
 * Formulaire public « Compléter mon dossier » : le candidat dépose son diplôme
 * et sa pièce d'identité (et éventuellement ses bulletins). Upload direct vers
 * le bucket candidature-docs (comme le formulaire d'admission), puis on
 * transmet les chemins à l'action serveur qui les rattache à la candidature.
 */
export function DossierUploadForm({
  token,
  needsDiploma,
  needsId,
}: {
  token: string;
  needsDiploma: boolean;
  needsId: boolean;
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
      const q = (sel: string) =>
        (form.querySelector(sel) as HTMLInputElement | null)?.files?.[0] ?? null;

      const [dip, idf] = await Promise.all([
        uploadDoc(supabase, folder, "diplome", q("#docDiploma")),
        uploadDoc(supabase, folder, "piece-identite", q("#docId")),
      ]);

      // Les pièces encore manquantes sont obligatoires : on bloque si l'upload
      // échoue (trop lourd, format, réseau) au lieu de valider un dossier vide.
      const problems: string[] = [];
      const check = (label: string, needed: boolean, r: UploadResult) => {
        if (!needed) return;
        if (r.reason === "trop-lourd") problems.push(`${label} dépasse 15 Mo`);
        else if (r.reason === "vide") problems.push(`${label} est manquant`);
        else if (r.reason === "echec") problems.push(`${label} n'a pas pu être envoyé`);
      };
      check("le dernier diplôme", needsDiploma, dip);
      check("la pièce d'identité", needsId, idf);
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

      const fd = new FormData();
      fd.set("token", token);
      if (dip.path) fd.set("docDiplomaPath", dip.path);
      if (idf.path) fd.set("docIdPath", idf.path);

      // Bulletins (optionnels, multiples).
      const bulletinInputs = form.querySelectorAll<HTMLInputElement>(
        'input[name="docBulletins"]'
      );
      const bulletinPaths: string[] = [];
      let i = 0;
      for (const inp of Array.from(bulletinInputs)) {
        const f = inp.files?.[0];
        if (f && f.size > 0) {
          i += 1;
          const r = await uploadDoc(supabase, folder, `bulletins-${i}`, f);
          if (r.path) bulletinPaths.push(r.path);
        }
      }
      if (bulletinPaths.length > 0) fd.set("docBulletinsPaths", bulletinPaths.join(","));

      const res = await completeDossier(null, fd);
      setState(res);
      if (res.ok) setDone(true);
    } catch {
      setState({
        ok: false,
        message: "Erreur lors de l'envoi des pièces. Vérifiez leur taille (15 Mo max) et réessayez.",
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
          {state?.message ??
            "Merci ! Vos pièces ont bien été transmises à l'IPMD."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {needsDiploma && (
        <Field label="Dernier diplôme" htmlFor="docDiploma" required>
          <input
            id="docDiploma"
            name="docDiploma"
            type="file"
            required
            accept=".pdf,.jpg,.jpeg,.png"
            className={fileInput}
          />
        </Field>
      )}

      {needsId && (
        <Field
          label="Pièce d'identité / passeport / titre de séjour"
          htmlFor="docId"
          required
        >
          <input
            id="docId"
            name="docId"
            type="file"
            required
            accept=".pdf,.jpg,.jpeg,.png"
            className={fileInput}
          />
        </Field>
      )}

      <Field label="Bulletins / relevés de notes (facultatif)" htmlFor="docBulletins">
        <input
          id="docBulletins"
          name="docBulletins"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className={fileInput}
        />
      </Field>

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
