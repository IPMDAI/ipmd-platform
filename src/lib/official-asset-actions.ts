"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { OFFICIAL_ASSETS_BUCKET } from "@/lib/secure-assets";
import type { FormResult } from "@/types";

/** Clés autorisées dans le bucket privé (aucune autre n'est acceptée). */
const OFFICIAL_ASSET_KEYS = [
  "signatures/directeur-etudes.png",
  "signatures/admin-general.png",
  "signatures/directrice-executive.png",
  "signatures/responsable-pedago.png",
  "stamps/cachet-ipmd.png",
] as const;

/**
 * Dépose ou remplace une signature / un cachet dans le bucket privé.
 * Réservé aux admins. Chaque opération est historisée (qui, quoi, quand).
 */
export async function uploadOfficialAsset(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const { supabase, userId } = await requireAdmin();

  const key = String(formData.get("key") ?? "");
  if (!(OFFICIAL_ASSET_KEYS as readonly string[]).includes(key))
    return { ok: false, message: "Emplacement invalide." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, message: "Choisissez d'abord un fichier, puis cliquez sur Déposer." };
  if (!file.type.startsWith("image/"))
    return { ok: false, message: "Format non supporté — déposez une image PNG." };
  if (file.size > 10 * 1024 * 1024)
    return { ok: false, message: "Fichier trop volumineux (10 Mo maximum)." };

  const admin = createAdminClient();
  if (!admin)
    return {
      ok: false,
      message: "Stockage non configuré (clé SUPABASE_SERVICE_ROLE_KEY manquante sur Vercel).",
    };

  // Déjà présent ? (pour historiser « ajout » vs « remplacement »)
  const [folder, name] = key.split("/");
  const { data: existing } = await admin.storage
    .from(OFFICIAL_ASSETS_BUCKET)
    .list(folder);
  const existed = (existing ?? []).some((o) => o.name === name);

  const buf = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await admin.storage
    .from(OFFICIAL_ASSETS_BUCKET)
    .upload(key, buf, {
      contentType: file.type || "image/png",
      upsert: true,
    });
  if (upErr) return { ok: false, message: `Échec de l'envoi : ${upErr.message}` };

  // Nom de l'admin pour l'historique.
  const { data: me } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .single();

  await admin.from("official_asset_log").insert({
    asset_key: key,
    action: existed ? "remplacement" : "ajout",
    performed_by: userId,
    performed_by_name: me?.full_name || me?.email || null,
  });

  revalidatePath("/espace/signatures");
  return { ok: true, message: existed ? "Fichier remplacé ✅" : "Fichier déposé ✅" };
}

/**
 * Retire une signature / un cachet du bucket privé (réservé aux admins).
 * Le document affichera alors « Signature autorisée ». Opération historisée.
 */
export async function removeOfficialAsset(formData: FormData): Promise<void> {
  const { supabase, userId } = await requireAdmin();

  const key = String(formData.get("key") ?? "");
  if (!(OFFICIAL_ASSET_KEYS as readonly string[]).includes(key)) return;

  const admin = createAdminClient();
  if (!admin) return;

  const { error } = await admin.storage
    .from(OFFICIAL_ASSETS_BUCKET)
    .remove([key]);
  if (error) return;

  const { data: me } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .single();

  await admin.from("official_asset_log").insert({
    asset_key: key,
    action: "suppression",
    performed_by: userId,
    performed_by_name: me?.full_name || me?.email || null,
  });

  revalidatePath("/espace/signatures");
}
