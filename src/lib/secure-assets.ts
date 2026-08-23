import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EmailAttachment } from "@/lib/email";

/**
 * Lecture d'images sensibles (signatures, cachets) depuis un bucket
 * Supabase Storage PRIVÉ (`official-assets`).
 *
 * 🔒 Sécurité :
 *  - Le bucket est privé : aucune URL publique, aucun accès anonyme.
 *  - Seul le SERVEUR lit les fichiers, via la clé service-role (jamais
 *    exposée au client).
 *  - L'image est renvoyée incrustée en data URI (base64) : elle n'apparaît
 *    qu'À L'INTÉRIEUR du document généré, jamais comme fichier séparé.
 *  - Les vrais fichiers ne sont PAS versionnés dans Git.
 */
export const OFFICIAL_ASSETS_BUCKET = "official-assets";

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
};

/**
 * Renvoie l'asset `path` (ex. "signatures/admin-general.png") du bucket privé
 * en data URI base64, ou null s'il n'existe pas / stockage non configuré.
 * Mémoïsé par requête (le même cachet n'est téléchargé qu'une fois).
 */
export const officialAssetDataUri = cache(
  async (path: string): Promise<string | null> => {
    const admin = createAdminClient();
    if (!admin) return null;

    const { data, error } = await admin.storage
      .from(OFFICIAL_ASSETS_BUCKET)
      .download(path);
    if (error || !data) return null;

    try {
      const buf = Buffer.from(await data.arrayBuffer());
      const ext = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
      const mime = MIME[ext] ?? "application/octet-stream";
      return `data:${mime};base64,${buf.toString("base64")}`;
    } catch {
      return null;
    }
  }
);

/**
 * Télécharge un document du bucket privé `official-assets` et le renvoie sous
 * forme de pièce jointe email (`{ filename, content: base64 }`) compatible avec
 * `sendScolariteEmail`. Sert à joindre des documents officiels remplaçables
 * (ex. RIB AFG Bank) sans les versionner dans Git et sans recopier de contenu
 * sensible dans le corps de l'email.
 *
 * Renvoie `null` si le fichier est absent / le stockage n'est pas configuré :
 * l'appelant NE DOIT PAS faire échouer l'action pour autant (email sans pièce
 * jointe). Un log serveur explicite est émis pour tracer l'absence.
 */
export async function officialAssetAttachment(
  path: string,
  filename: string
): Promise<EmailAttachment | null> {
  const admin = createAdminClient();
  if (!admin) {
    console.warn(`[official-assets] service-role indisponible — pièce jointe "${filename}" non ajoutée.`);
    return null;
  }

  const { data, error } = await admin.storage.from(OFFICIAL_ASSETS_BUCKET).download(path);
  if (error || !data) {
    console.warn(
      `[official-assets] document "${path}" introuvable dans le bucket "${OFFICIAL_ASSETS_BUCKET}" — pièce jointe "${filename}" non ajoutée${error ? ` (${error.message})` : ""}.`
    );
    return null;
  }

  try {
    const buf = Buffer.from(await data.arrayBuffer());
    return { filename, content: buf.toString("base64") };
  } catch (e) {
    console.warn(
      `[official-assets] échec d'encodage de "${path}" — pièce jointe "${filename}" non ajoutée (${e instanceof Error ? e.message : "erreur inconnue"}).`
    );
    return null;
  }
}
