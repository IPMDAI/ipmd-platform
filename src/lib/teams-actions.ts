"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/types";

/**
 * Gestion des Équipes & Accès par univers — RÉSERVÉ super_admin.
 * Écritures via le client utilisateur (rôle `authenticated`) : la RLS
 * super_admin-only des tables staff_* reste la garde (aucun contournement,
 * aucune élévation service-role). Le rôle `admin` n'obtient aucun accès.
 */
async function requireSuperAdmin(): Promise<{
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>;
} | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "super_admin") return null;
  return { supabase };
}

const R = "/espace/equipes";

export async function createTeam(universe: string, name: string): Promise<FormResult> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { ok: false, message: "Action réservée au Super Admin." };
  const n = name.trim();
  if (!n) return { ok: false, message: "Nom d'équipe requis." };
  if (!universe) return { ok: false, message: "Univers requis." };
  const { error } = await ctx.supabase.from("staff_teams").insert({ universe, name: n });
  if (error)
    return {
      ok: false,
      message: /duplicate|unique/i.test(error.message)
        ? "Une équipe de ce nom existe déjà dans cet univers."
        : /foreign key|universe/i.test(error.message)
          ? "Univers invalide."
          : error.message,
    };
  revalidatePath(R);
  return { ok: true, message: "Équipe créée." };
}

export async function deleteTeam(teamId: string): Promise<FormResult> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { ok: false, message: "Action réservée au Super Admin." };
  const { error } = await ctx.supabase.from("staff_teams").delete().eq("id", teamId);
  if (error) return { ok: false, message: error.message };
  revalidatePath(R);
  return { ok: true, message: "Équipe supprimée." };
}

export async function addMember(teamId: string, profileId: string): Promise<FormResult> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { ok: false, message: "Action réservée au Super Admin." };
  const { error } = await ctx.supabase
    .from("staff_team_members")
    .insert({ team_id: teamId, profile_id: profileId });
  if (error)
    return {
      ok: false,
      message: /duplicate|unique/i.test(error.message)
        ? "Cette personne est déjà membre de l'équipe."
        : error.message,
    };
  revalidatePath(R);
  return { ok: true, message: "Membre ajouté." };
}

export async function removeMember(teamId: string, profileId: string): Promise<FormResult> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { ok: false, message: "Action réservée au Super Admin." };
  // Si la personne est le responsable, on retire d'abord ce statut (la FK
  // composite lead↔membre interdit de supprimer un membre encore responsable).
  await ctx.supabase.from("staff_teams").update({ lead_id: null }).eq("id", teamId).eq("lead_id", profileId);
  const { error } = await ctx.supabase
    .from("staff_team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("profile_id", profileId);
  if (error) return { ok: false, message: error.message };
  revalidatePath(R);
  return { ok: true, message: "Membre retiré." };
}

export async function setLead(teamId: string, profileId: string | null): Promise<FormResult> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { ok: false, message: "Action réservée au Super Admin." };
  if (profileId) {
    const { error } = await ctx.supabase.from("staff_teams").update({ lead_id: profileId }).eq("id", teamId);
    if (error)
      return {
        ok: false,
        message: /lead_is_member|foreign key/i.test(error.message)
          ? "Le responsable doit d'abord être membre de l'équipe."
          : error.message,
      };
    await ctx.supabase.from("staff_team_members").update({ is_lead: false }).eq("team_id", teamId);
    await ctx.supabase
      .from("staff_team_members")
      .update({ is_lead: true })
      .eq("team_id", teamId)
      .eq("profile_id", profileId);
    revalidatePath(R);
    return { ok: true, message: "Responsable désigné." };
  }
  await ctx.supabase.from("staff_teams").update({ lead_id: null }).eq("id", teamId);
  await ctx.supabase.from("staff_team_members").update({ is_lead: false }).eq("team_id", teamId);
  revalidatePath(R);
  return { ok: true, message: "Responsable retiré." };
}

export async function grantPermission(teamId: string, permissionKey: string): Promise<FormResult> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { ok: false, message: "Action réservée au Super Admin." };
  const { error } = await ctx.supabase
    .from("staff_team_permissions")
    .insert({ team_id: teamId, permission_key: permissionKey });
  if (error)
    return {
      ok: false,
      message: /duplicate|unique/i.test(error.message) ? "Permission déjà accordée." : error.message,
    };
  revalidatePath(R);
  return { ok: true, message: "Permission accordée." };
}

export async function revokePermission(teamId: string, permissionKey: string): Promise<FormResult> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { ok: false, message: "Action réservée au Super Admin." };
  const { error } = await ctx.supabase
    .from("staff_team_permissions")
    .delete()
    .eq("team_id", teamId)
    .eq("permission_key", permissionKey);
  if (error) return { ok: false, message: error.message };
  revalidatePath(R);
  return { ok: true, message: "Permission retirée." };
}

/**
 * Changement de statut d'une candidature — SEUL chemin autorisé pour le staff.
 * Passe par la RPC `set_candidature_status` (SECURITY DEFINER, colonne `status`
 * uniquement, gardée par has_staff_permission). AUCUN UPDATE direct.
 * super_admin comme staff empruntent ce même chemin.
 */
export async function setCandidatureStatus(candidatureId: string, status: string): Promise<FormResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Non connecté." };
  const { error } = await supabase.rpc("set_candidature_status", {
    p_candidature: candidatureId,
    p_status: status,
  });
  if (error)
    return {
      ok: false,
      message: /NOT_ALLOWED/.test(error.message)
        ? "Action non autorisée pour cet univers."
        : /INTROUVABLE/.test(error.message)
          ? "Candidature introuvable."
          : error.message,
    };
  revalidatePath("/espace/candidatures");
  return { ok: true, message: "Statut mis à jour." };
}
