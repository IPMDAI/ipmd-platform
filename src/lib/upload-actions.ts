"use server";

import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "candidature-docs";

// Chemin attendu : « <uuid>/<nom-fichier>.<ext> » (dossier = UUID généré côté
// navigateur). On valide le format pour empêcher tout écriture ailleurs.
const PATH_RE = /^[0-9a-fA-F-]{36}\/[a-z0-9-]+\.[a-z0-9]+$/;

/**
 * Génère un « ticket » d'upload signé pour une pièce de candidature.
 *
 * Le navigateur envoie ensuite le fichier DIRECTEMENT au stockage avec ce
 * ticket (via `uploadToSignedUrl`). Cela contourne la RLS (le ticket est signé
 * côté serveur avec la clé service_role) SANS faire transiter le fichier par le
 * serveur — donc pas de limite de taille de requête (fichiers jusqu'à 15 Mo).
 *
 * Renvoie le token du ticket, ou `null` si l'opération échoue.
 */
export async function createUploadTicket(path: string): Promise<string | null> {
  if (!path || !PATH_RE.test(path)) return null;

  const admin = createAdminClient();
  if (!admin) return null;

  const sign = () =>
    admin.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: true });

  let { data, error } = await sign();

  // Si le bucket n'existe pas encore, on le crée (privé) puis on réessaie.
  if (error) {
    await admin.storage
      .createBucket(BUCKET, {
        public: false,
        fileSizeLimit: 15 * 1024 * 1024,
        allowedMimeTypes: [
          "application/pdf",
          "image/jpeg",
          "image/png",
        ],
      })
      .catch(() => {});
    ({ data, error } = await sign());
  }

  return error || !data ? null : data.token;
}
