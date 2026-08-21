"use client";

import { useState } from "react";
import type { UniverseId } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { createUploadTicket } from "@/lib/upload-actions";
import type { BackgroundVariant } from "./background";
import {
  activeDocProfileKey,
  docSlug,
  documentLinesForProfile,
  type DocRequirement,
  type Project,
  type Uploads,
  type WizardCatalog,
} from "./project";

const MAX_FILE = 15 * 1024 * 1024;
const ACCEPT = ".pdf,.jpg,.jpeg,.png";
const ALLOWED_EXT = ["pdf", "jpg", "jpeg", "png"];

const badge: Record<DocRequirement, { c: string; t: string }> = {
  required: { c: "bg-ipmd-red/10 text-ipmd-red", t: "Obligatoire" },
  optional: { c: "bg-black/[0.06] text-black/55", t: "Facultatif" },
  conditional: { c: "bg-amber-100 text-amber-800", t: "Selon votre dossier" },
};

const fileInputClass =
  "block w-full cursor-pointer rounded-xl border border-dashed border-black/25 bg-white px-3 py-2.5 text-[13px] text-black/55 transition hover:border-ipmd-red/50 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-ipmd-red file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white";

const baseName = (path: string) => path.split("/").pop() ?? path;

/** Upload direct au bucket privé (ticket signé service_role, pas de transit serveur). */
async function uploadDoc(
  folder: string,
  docKey: string,
  file: File,
): Promise<{ path: string } | { error: string }> {
  const ext = (file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!ALLOWED_EXT.includes(ext)) return { error: "Format non accepté (PDF, JPG, JPEG ou PNG)." };
  if (file.size === 0) return { error: "Fichier vide." };
  if (file.size > MAX_FILE) return { error: "Fichier trop lourd (15 Mo max)." };

  const supabase = createClient();
  if (!supabase) return { error: "Service indisponible. Réessayez plus tard." };

  // Nom unique : slug(doc_key) + suffixe aléatoire → pas d'écrasement entre fichiers.
  const rand = Math.random().toString(36).slice(2, 8);
  const path = `${folder}/${docSlug(docKey)}-${rand}.${ext}`;
  const token = await createUploadTicket(path);
  if (!token) return { error: "Envoi impossible (ticket refusé). Réessayez." };
  const { error } = await supabase.storage
    .from("candidature-docs")
    .uploadToSignedUrl(path, token, file, { upsert: true });
  return error ? { error: "Échec de l'envoi. Vérifiez votre connexion et réessayez." } : { path };
}

/**
 * Étape 4 — Pièces justificatives (upload réel). Data-driven via
 * `document_profiles` : required bloque Suivant, optional facultatif,
 * conditional ne bloque pas (« pourra être demandé selon votre dossier »).
 * Réutilise le bucket privé `candidature-docs` (ticket signé). L'état des
 * chemins vit dans la coquille → persistant à la navigation. Aucun submit ici.
 */
export function Step4Pieces({
  universe,
  variant,
  catalog,
  project,
  uploads,
  onUploadsChange,
  getFolder,
}: {
  universe: UniverseId | null;
  variant: BackgroundVariant;
  catalog: WizardCatalog;
  project: Project;
  uploads: Uploads;
  onUploadsChange: (next: Uploads) => void;
  getFolder: () => string;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const profileKey = activeDocProfileKey(project, universe, variant, catalog);
  const lines = documentLinesForProfile(profileKey, catalog);

  const setErr = (docKey: string, msg: string | null) =>
    setErrors((e) => {
      const next = { ...e };
      if (msg) next[docKey] = msg;
      else delete next[docKey];
      return next;
    });

  const handleFile = async (docKey: string, input: HTMLInputElement) => {
    const file = input.files?.[0];
    input.value = ""; // réautorise le même fichier plus tard
    if (!file) return;
    setErr(docKey, null);
    setBusy(docKey);
    const r = await uploadDoc(getFolder(), docKey, file);
    setBusy(null);
    if ("error" in r) {
      setErr(docKey, r.error);
      return;
    }
    onUploadsChange({ ...uploads, [docKey]: [...(uploads[docKey] ?? []), r.path] });
  };

  const removeFile = (docKey: string, path: string) => {
    // Retrait de l'état (le fichier privé reste en Storage, non référencé —
    // nettoyage des orphelins = sujet séparé, hors périmètre).
    const next = { ...uploads, [docKey]: (uploads[docKey] ?? []).filter((p) => p !== path) };
    if (next[docKey].length === 0) delete next[docKey];
    onUploadsChange(next);
  };

  return (
    <div>
      <h2 className="text-xl font-extrabold tracking-tight text-ipmd-black sm:text-2xl">
        Pièces justificatives
      </h2>
      <p className="mt-1 text-sm text-black/55">
        Téléversez les documents demandés. Formats acceptés : PDF, JPG, PNG · 15 Mo max par fichier.
      </p>

      {lines.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center text-sm font-semibold text-amber-900">
          Le profil documentaire de ce programme n'est pas encore défini.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {lines.map((d) => {
            const b = badge[d.requirement];
            const files = uploads[d.docKey] ?? [];
            const has = files.length > 0;
            const isReq = d.requirement === "required";
            const satisfied = has || !isReq;
            return (
              <div
                key={d.docKey}
                className={`rounded-2xl border p-3.5 ${
                  isReq && !has ? "border-ipmd-red/30 bg-ipmd-red/[0.02]" : "border-black/10 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-sm ${has ? "text-emerald-600" : isReq ? "text-ipmd-red" : "text-black/30"}`}
                    aria-hidden="true"
                  >
                    {has ? "✓" : "○"}
                  </span>
                  <span className="flex-1 text-sm font-semibold text-ipmd-black">{d.label}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${b.c}`}>{b.t}</span>
                </div>

                {d.requirement === "conditional" && (
                  <p className="mt-1 pl-6 text-[11px] text-amber-700">
                    Pourra être demandé selon votre dossier.
                  </p>
                )}

                {/* Fichiers déjà téléversés */}
                {files.length > 0 && (
                  <ul className="mt-2 space-y-1 pl-6">
                    {files.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-[12px]">
                        <span className="truncate rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800">
                          📎 {baseName(p)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(d.docKey, p)}
                          className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-semibold text-black/55 hover:bg-black/10"
                        >
                          Supprimer
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Ajout / remplacement */}
                <div className="mt-2 pl-6">
                  <label className="sr-only" htmlFor={`file-${d.docKey}`}>
                    {has ? `Ajouter un fichier pour ${d.label}` : `Téléverser ${d.label}`}
                  </label>
                  <input
                    id={`file-${d.docKey}`}
                    type="file"
                    accept={ACCEPT}
                    disabled={busy === d.docKey}
                    onChange={(e) => handleFile(d.docKey, e.currentTarget)}
                    className={fileInputClass}
                  />
                  {busy === d.docKey && <p className="mt-1 text-[11px] text-black/45">Envoi en cours…</p>}
                  {errors[d.docKey] && (
                    <p className="mt-1 text-[11px] font-medium text-ipmd-red">{errors[d.docKey]}</p>
                  )}
                  {!satisfied && !errors[d.docKey] && busy !== d.docKey && (
                    <p className="mt-1 text-[11px] text-ipmd-red">Ce document est obligatoire.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
