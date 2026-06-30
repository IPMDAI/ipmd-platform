import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

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
