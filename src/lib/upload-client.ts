import { createClient } from "@/lib/supabase/client";
import { createUploadTicket } from "@/lib/upload-actions";

const MAX_FILE = 15 * 1024 * 1024;

/**
 * Téléverse un fichier de conversation vers le bucket privé candidature-docs
 * (upload direct via ticket signé). Renvoie { path, name } ou { error }.
 */
export async function uploadConversationFile(
  file: File
): Promise<{ path: string; name: string } | { error: string }> {
  if (!file || file.size === 0) return { error: "Fichier vide." };
  if (file.size > MAX_FILE) return { error: "Fichier trop lourd (15 Mo max)." };
  const supabase = createClient();
  if (!supabase) return { error: "Service indisponible." };
  const folder = crypto.randomUUID();
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${folder}/piece.${ext}`;
  const token = await createUploadTicket(path);
  if (!token) return { error: "Envoi impossible (format PDF, JPG ou PNG)." };
  const { error } = await supabase.storage
    .from("candidature-docs")
    .uploadToSignedUrl(path, token, file, { upsert: true });
  if (error) return { error: "Échec de l'envoi du fichier." };
  return { path, name: file.name };
}
