import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Autorisation « staff par univers » (module Équipes & Accès).
 * `super_admin` passe toujours ; sinon on délègue à la fonction DB
 * `has_staff_permission(permission, universe)` (SECURITY DEFINER) — true SSI le
 * profil est membre d'une équipe qui accorde la permission ET dont l'univers = univers cible.
 * L'appel RPC passe par le client utilisateur (rôle `authenticated`) : aucune
 * élévation de privilège côté client, aucun contournement de la RLS.
 */
export type StaffContext = {
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>;
  userId: string;
  role: string | null;
};

export async function requireStaff(
  permission: string,
  universe: string
): Promise<StaffContext | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = (me?.role as string) ?? null;
  if (role === "super_admin") return { supabase, userId: user.id, role };

  const { data: allowed } = await supabase.rpc("has_staff_permission", {
    p_permission: permission,
    p_universe: universe,
  });
  if (allowed === true) return { supabase, userId: user.id, role };
  return null;
}

/** Variante booléenne (affichage conditionnel). */
export async function canStaff(permission: string, universe: string): Promise<boolean> {
  return (await requireStaff(permission, universe)) !== null;
}

/**
 * Vrai si l'utilisateur possède `permission` sur AU MOINS UN univers
 * (super_admin → toujours vrai). S'appuie sur la fonction DB
 * `has_any_staff_permission` (SECURITY DEFINER). Sert aux gardes de page/nav
 * indépendantes d'un univers précis (ex. accès à la liste des candidatures).
 */
export async function canAnyStaff(permission: string): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role === "super_admin") return true;
  const { data } = await supabase.rpc("has_any_staff_permission", { p_permission: permission });
  return data === true;
}

/**
 * Garde de la page Candidatures : super_admin OU staff `view_candidatures` sur au
 * moins un univers. Le rôle `admin` legacy n'a AUCUN accès automatique (tout par
 * équipes). Renvoie le contexte, ou `null` (la page redirige alors).
 */
export async function requireCandidaturesAccess(): Promise<StaffContext | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = (me?.role as string) ?? null;
  if (role === "super_admin") return { supabase, userId: user.id, role };
  const { data } = await supabase.rpc("has_any_staff_permission", { p_permission: "view_candidatures" });
  if (data === true) return { supabase, userId: user.id, role };
  return null;
}
