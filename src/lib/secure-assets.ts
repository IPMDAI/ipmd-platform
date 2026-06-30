import fs from "node:fs";
import path from "node:path";

/**
 * Lecture d'images sensibles (signatures, cachets) stockées HORS de public/.
 *
 * 🔒 Sécurité : les fichiers vivent dans `private/` à la racine du projet.
 * Ce dossier n'est PAS servi par le serveur web → aucune URL publique.
 * On lit le fichier côté serveur et on le renvoie incrusté en data URI
 * (base64) : l'image n'apparaît qu'À L'INTÉRIEUR du document rendu pour un
 * utilisateur autorisé (admin), jamais accessible directement par URL.
 */
const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

/**
 * Renvoie l'image privée `private/<relPath>` en data URI base64,
 * ou null si elle n'existe pas.
 */
export function privateImageDataUri(relPath: string): string | null {
  // Garde anti-traversée de répertoire.
  const safe = relPath
    .replace(/\\/g, "/")
    .replace(/\.\.+/g, "")
    .replace(/^\/+/, "");
  const full = path.join(process.cwd(), "private", safe);

  try {
    if (!fs.existsSync(full)) return null;
    const buf = fs.readFileSync(full);
    const ext = path.extname(full).toLowerCase();
    const mime = MIME[ext] ?? "application/octet-stream";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
