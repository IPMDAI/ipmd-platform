"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { VALID_ROLES } from "@/lib/dashboards";
import type { FormResult } from "@/types";

/**
 * Change le rôle d'un utilisateur. Réservé au Super Admin.
 * La RLS Supabase applique aussi cette restriction côté base.
 */
export async function updateUserRole(
  userId: string,
  newRole: string
): Promise<FormResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "Service indisponible." };
  }
  if (!VALID_ROLES.includes(newRole)) {
    return { ok: false, message: "Rôle invalide." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "Non authentifié." };
  }

  // Vérifie que le demandeur est bien Super Admin.
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (me?.role !== "super_admin") {
    return { ok: false, message: "Action réservée au Super Admin." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/espace/utilisateurs");
  return { ok: true, message: "Rôle mis à jour." };
}

/** Vérifie que le demandeur est admin ou super_admin. */
async function getAdmin() {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "super_admin" && me?.role !== "admin") return null;
  return { supabase, user, role: me.role as string };
}

/**
 * Crée le lien parent↔enfant (`parent_links`) — SOURCE UNIQUE d'écriture, partagée
 * par le sélecteur global et le bouton « + Lier un étudiant » d'une fiche parent.
 * L'unicité (parent_id, student_id) empêche les doublons (23505). Journalise le
 * rattachement dans `audit_log` (best-effort). Ne touche JAMAIS aux données
 * académiques : écrit uniquement une ligne de relation.
 */
async function createParentLink(
  ctx: NonNullable<Awaited<ReturnType<typeof getAdmin>>>,
  parentId: string,
  studentId: string,
  relationship: string | null
): Promise<FormResult> {
  const { data: link, error } = await ctx.supabase
    .from("parent_links")
    .insert({ parent_id: parentId, student_id: studentId, relationship })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { ok: false, message: "Ce lien existe déjà." };
    return { ok: false, message: error.message };
  }

  // Journalisation (best-effort — n'empêche jamais le rattachement). L'INSERT dans
  // audit_log (append-only, sans policy INSERT pour authenticated) passe par le client
  // service-role, qui contourne la RLS ; indisponible en local → simplement ignoré.
  try {
    const admin = createAdminClient();
    if (admin) {
      const { data: rows } = await ctx.supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", [ctx.user.id, parentId, studentId]);
      const byId = new Map((rows ?? []).map((p) => [p.id as string, p]));
      const me = byId.get(ctx.user.id);
      const parentName = byId.get(parentId)?.full_name || byId.get(parentId)?.email || parentId;
      const childName = byId.get(studentId)?.full_name || byId.get(studentId)?.email || studentId;
      const relLabel = relationship ? ` (${relationship})` : "";
      await admin.from("audit_log").insert({
        actor_id: ctx.user.id,
        actor_role: ctx.role,
        action_type: "create",
        action: "parent_link_created",
        entity_type: "parent_link",
        entity_id: link.id,
        student_id: studentId,
        summary: `Rattachement parent→enfant : ${parentName}${relLabel} → ${childName}`,
        new_value: { parent_id: parentId, student_id: studentId, relationship },
        actor_name: me?.full_name ?? null,
        actor_email: me?.email ?? null,
      });
    }
  } catch {
    // audit indisponible : le lien reste créé
  }

  revalidatePath("/espace/parents");
  revalidatePath(`/espace/parents/${parentId}`);
  return { ok: true, message: "Lien créé." };
}

/** Relie un parent à un enfant (réservé aux admins) — sélecteur global (FormData). */
export async function linkParentChild(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  const parentId = formData.get("parent_id");
  const studentId = formData.get("student_id");
  if (typeof parentId !== "string" || typeof studentId !== "string" || !parentId || !studentId) {
    return { ok: false, message: "Sélectionnez un parent et un enfant." };
  }
  const relRaw = formData.get("relationship");
  const relationship = typeof relRaw === "string" && relRaw ? relRaw : null;

  return createParentLink(ctx, parentId, studentId, relationship);
}

/**
 * Lie un étudiant EXISTANT à un parent donné (bouton « + Lier un étudiant » d'une
 * fiche parent). Ne crée AUCUN compte, ne modifie AUCUNE donnée académique.
 */
export async function linkStudentToParent(
  parentId: string,
  studentId: string,
  relationship: string | null
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  if (!parentId || !studentId) return { ok: false, message: "Parent ou étudiant manquant." };
  return createParentLink(ctx, parentId, studentId, relationship);
}

/**
 * Recherche d'étudiants EXISTANTS à rattacher à un parent (nom/prénom, email,
 * matricule). Exclut ceux déjà liés à ce parent. Lecture seule, réservé aux admins.
 */
export async function searchStudentsForLink(
  parentId: string,
  query: string
): Promise<{ id: string; full_name: string | null; email: string; matricule: string | null }[]> {
  const ctx = await getAdmin();
  if (!ctx) return [];
  // Neutralise les caractères qui casseraient/injecteraient la syntaxe or()/ilike.
  const q = query.trim().replace(/[,()*%\\]/g, " ").replace(/\s+/g, " ").trim();
  if (q.length < 2) return [];

  const { data: rows } = await ctx.supabase
    .from("profiles")
    .select("id, full_name, email, matricule")
    .eq("role", "etudiant")
    .or(`full_name.ilike.%${q}%,email.ilike.%${q}%,matricule.ilike.%${q}%`)
    .order("full_name")
    .limit(10);

  // Exclut les étudiants déjà rattachés à CE parent (anti-doublon côté UI).
  const { data: existing } = await ctx.supabase
    .from("parent_links")
    .select("student_id")
    .eq("parent_id", parentId);
  const linked = new Set((existing ?? []).map((l) => l.student_id as string));

  return (rows ?? [])
    .filter((r) => !linked.has(r.id as string))
    .map((r) => ({
      id: r.id as string,
      full_name: (r.full_name as string) ?? null,
      email: r.email as string,
      matricule: (r.matricule as string) ?? null,
    }));
}

/** Met à jour les coordonnées d'un profil (étudiant ou enseignant). */
export async function setProfileContacts(
  userId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  const val = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };
  const { error } = await ctx.supabase
    .from("profiles")
    .update({
      phone: val("phone"),
      whatsapp: val("whatsapp"),
      personal_email: val("personal_email"),
      school_email: val("school_email"),
    })
    .eq("id", userId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/espace/etudiants");
  revalidatePath("/espace/enseignants");
  return { ok: true, message: "Coordonnées enregistrées." };
}

/**
 * Complète l'état civil d'un étudiant (date + lieu de naissance) et,
 * éventuellement, l'affecte à une classe (ce qui définit sa filière).
 * Réservé aux admins.
 */
export async function setStudentCivil(
  userId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  const str = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };
  const fullName = str("full_name");
  const birthDate = str("birth_date");
  const birthPlace = str("birth_place");
  const classId = str("class_id");

  // On ne met à jour le nom que s'il est fourni (jamais l'effacer).
  const patch: Record<string, unknown> = {
    birth_date: birthDate,
    birth_place: birthPlace,
  };
  if (fullName) patch.full_name = fullName;

  const { error } = await ctx.supabase.from("profiles").update(patch).eq("id", userId);
  if (error) return { ok: false, message: error.message };

  if (classId) {
    const { error: cErr } = await ctx.supabase
      .from("class_members")
      .upsert({ class_id: classId, student_id: userId }, { onConflict: "student_id" });
    if (cErr) return { ok: false, message: `Naissance OK, mais classe : ${cErr.message}` };
  }

  revalidatePath("/espace/etudiants");
  return { ok: true, message: "Enregistré ✅" };
}

/**
 * Active / désactive un document pour un étudiant (par type).
 * Tant qu'un document n'est pas activé ici, l'étudiant ne le voit pas.
 * Réservé aux admins.
 */
export async function setDocumentGrant(formData: FormData): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;

  const studentId = String(formData.get("student_id") ?? "");
  const docType = String(formData.get("doc_type") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  const signatory = String(formData.get("signatory") ?? "").trim() || null;
  if (!studentId || !docType) return;

  const {
    data: { user },
  } = await ctx.supabase.auth.getUser();
  let name: string | null = null;
  if (user) {
    const { data: me } = await ctx.supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();
    name = me?.full_name || me?.email || null;
  }

  await ctx.supabase.from("document_grants").upsert(
    {
      student_id: studentId,
      doc_type: docType,
      active,
      signatory,
      granted_by: user?.id ?? null,
      granted_by_name: name,
      granted_at: new Date().toISOString(),
    },
    { onConflict: "student_id,doc_type" }
  );

  revalidatePath("/espace/documents");
}

/**
 * Supprime UNIQUEMENT la ligne `parent_links` correspondante (détachement).
 * Ne supprime NI le parent, NI l'étudiant, NI notes/paiements/documents. Après
 * suppression, le parent perd l'accès à cet étudiant via la RLS existante. Réservé
 * aux admins. Journalise dans `audit_log` (acteur, parent, étudiant, relation
 * supprimée) via le client service-role — exécuté CÔTÉ SERVEUR uniquement
 * (fichier "use server"), la clé service_role n'est jamais envoyée au navigateur.
 */
export async function unlinkParentChild(
  linkId: string,
  _formData?: FormData
): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;

  // Lit le lien AVANT suppression (pour tracer la relation + les acteurs).
  const { data: link } = await ctx.supabase
    .from("parent_links")
    .select("parent_id, student_id, relationship")
    .eq("id", linkId)
    .maybeSingle();

  const { error } = await ctx.supabase.from("parent_links").delete().eq("id", linkId);
  if (error || !link) {
    revalidatePath("/espace/parents");
    return;
  }

  // Journalisation best-effort (service-role, append-only, serveur uniquement).
  try {
    const admin = createAdminClient();
    if (admin) {
      const { data: rows } = await ctx.supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", [ctx.user.id, link.parent_id, link.student_id]);
      const byId = new Map((rows ?? []).map((p) => [p.id as string, p]));
      const me = byId.get(ctx.user.id);
      const parentName =
        byId.get(link.parent_id)?.full_name || byId.get(link.parent_id)?.email || link.parent_id;
      const childName =
        byId.get(link.student_id)?.full_name || byId.get(link.student_id)?.email || link.student_id;
      const relLabel = link.relationship ? ` (${link.relationship})` : "";
      await admin.from("audit_log").insert({
        actor_id: ctx.user.id,
        actor_role: ctx.role,
        action_type: "delete",
        action: "parent_link_removed",
        entity_type: "parent_link",
        entity_id: linkId,
        student_id: link.student_id,
        summary: `Détachement parent→enfant : ${parentName}${relLabel} ✕ ${childName}`,
        old_value: {
          parent_id: link.parent_id,
          student_id: link.student_id,
          relationship: link.relationship,
        },
        actor_name: me?.full_name ?? null,
        actor_email: me?.email ?? null,
      });
    }
  } catch {
    // audit indisponible : le détachement reste effectif
  }

  revalidatePath("/espace/parents");
  revalidatePath(`/espace/parents/${link.parent_id}`);
}
