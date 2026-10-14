"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/types";

/**
 * Actions « Conventions de stage — signature AG » (D8-UI-4).
 * Réservées admin / super_admin (Administrateur Général). Le DÉ ne signe JAMAIS.
 * La signature passe EXCLUSIVEMENT par la RPC convention_sign (atomique, auditée,
 * impossible 2×, impossible si annulée, liée à la version EXACTE du fichier).
 * Le dépôt de la copie signée réutilise le système documentaire existant
 * (student_documents + submitDocument) — aucun 2e système.
 */

async function requireAdmin() {
  const supabase = await createClient();
  if (!supabase) return { error: "Service indisponible." as string };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." as string };
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!["admin", "super_admin"].includes(me?.role ?? ""))
    return { error: "Réservé à l'Administrateur Général." as string };
  return { supabase, userId: user.id };
}

/**
 * Prépare le dépôt de la copie signée : crée (ou réutilise) le dossier
 * documentaire 'convention_stage' de l'étudiant. Idempotent.
 */
export async function prepareConventionDocument(
  studentId: string,
  _p: FormResult | null,
  _fd: FormData
): Promise<FormResult> {
  const g = await requireAdmin();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  if (!studentId) return { ok: false, message: "Étudiant manquant." };

  const { data: existing } = await g.supabase
    .from("student_documents")
    .select("id")
    .eq("student_id", studentId)
    .eq("doc_key", "convention_stage")
    .limit(1)
    .maybeSingle();

  if (!existing) {
    const { error } = await g.supabase.from("student_documents").insert({
      student_id: studentId,
      label: "Convention de stage signée",
      doc_key: "convention_stage",
      status: "a_fournir",
      requested_by: g.userId,
    });
    if (error) return { ok: false, message: error.message };
  }

  revalidatePath("/espace/conventions");
  return { ok: true, message: "Dépôt préparé." };
}

/**
 * Signe la convention : a_signer → signee, via la RPC convention_sign.
 * AG only (la RPC re-vérifie), copie signée EXACTE (submission) obligatoire.
 */
export async function signConvention(
  conventionId: string,
  documentId: string,
  _p: FormResult | null,
  fd: FormData
): Promise<FormResult> {
  const g = await requireAdmin();
  if ("error" in g) return { ok: false, message: g.error ?? "Accès refusé." };
  const submissionId = String(fd.get("submission_id") ?? "").trim();
  if (!submissionId) return { ok: false, message: "Sélectionnez la copie signée exacte." };

  const { error } = await g.supabase.rpc("convention_sign", {
    p_convention: conventionId,
    p_signed_document: documentId,
    p_signed_submission: submissionId,
    p_reason: String(fd.get("reason") ?? "").trim() || null,
  });
  if (error) {
    const m = error.message || "";
    if (m.includes("Administrateur")) return { ok: false, message: "Signature réservée à l'Administrateur Général." };
    if (m.includes("déjà signée") || m.includes("annulée") || m.includes("non soumise")) return { ok: false, message: "Convention introuvable, déjà signée, annulée ou non soumise." };
    if (m.includes("concurrente")) return { ok: false, message: "Signature concurrente détectée — rechargez." };
    if (m.includes("appartient")) return { ok: false, message: "La copie signée ne correspond pas à cet étudiant/dossier." };
    return { ok: false, message: m };
  }

  revalidatePath("/espace/conventions");
  return { ok: true, message: "Convention signée." };
}
