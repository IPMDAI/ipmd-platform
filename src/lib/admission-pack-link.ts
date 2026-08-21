import "server-only";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://ipmd.pro"
).replace(/\/$/, "");

const DEFAULT_TTL_DAYS = 30;

/** Hash SHA-256 (hex) — on ne stocke JAMAIS le token en clair. */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** URL publique de l'espace d'admission (contient le token brut). */
export function packLinkUrl(token: string): string {
  return `${SITE_URL}/admission/pack?t=${token}`;
}

/**
 * Génère un nouveau lien pour un pack : révoque d'abord les liens actifs
 * existants (1 seul actif à la fois), puis crée le nouveau et renvoie le
 * token BRUT (à placer dans l'URL/email — jamais restocké).
 */
export async function generatePackLink(
  packId: string,
  createdBy?: string,
  ttlDays = DEFAULT_TTL_DAYS
): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) return null;

  await admin
    .from("admission_pack_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("pack_id", packId)
    .is("revoked_at", null);

  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 3600 * 1000).toISOString();

  const { error } = await admin.from("admission_pack_links").insert({
    pack_id: packId,
    token_hash: hashToken(token),
    expires_at: expiresAt,
    sent_at: new Date().toISOString(),
    created_by: createdBy ?? null,
  });
  if (error) return null;
  return token;
}

export type PackLinkResult = { packId: string; linkId: string } | null;

/**
 * Vérifie un token : renvoie le pack si le lien est valide (existe, non révoqué,
 * non expiré). Marque la 1re utilisation (used_at). Lecture via service-role.
 */
export async function verifyPackToken(token: string): Promise<PackLinkResult> {
  if (!token) return null;
  const admin = createAdminClient();
  if (!admin) return null;

  const { data } = await admin
    .from("admission_pack_links")
    .select("id, pack_id, expires_at, revoked_at, used_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (!data) return null;
  if (data.revoked_at) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;

  if (!data.used_at) {
    await admin
      .from("admission_pack_links")
      .update({ used_at: new Date().toISOString() })
      .eq("id", data.id);
  }

  return { packId: data.pack_id, linkId: data.id };
}

/** Révoque tous les liens actifs d'un pack (l'ancien lien devient invalide). */
export async function revokePackLinks(packId: string): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;
  const { error } = await admin
    .from("admission_pack_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("pack_id", packId)
    .is("revoked_at", null);
  return !error;
}
