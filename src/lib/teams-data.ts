import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Rôles ÉLIGIBLES au staff (membres d'équipe). Exclut strictement les apprenants
 * (etudiant/professionnel/dirigeant), les parents et le super_admin (global, jamais
 * membre). Un étudiant ne peut donc JAMAIS être ajouté à une équipe staff.
 */
const STAFF_ROLES = ["admin", "scolarite", "pedagogie", "enseignant"] as const;

/**
 * Libellés des permissions définis EN CODE (source de vérité d'affichage),
 * indépendants du `label` stocké en base — évite tout mojibake d'encodage.
 * Clés = `staff_permissions.permission_key`.
 */
export const PERMISSION_LABELS: Record<string, string> = {
  view_candidatures: "Voir les candidatures",
  edit_candidature_status: "Modifier le statut d'une candidature",
  view_documents: "Voir les documents",
  view_finance: "Voir la finance",
  record_payments: "Enregistrer des paiements",
  view_students: "Voir les étudiants",
  manage_classes: "Gérer les classes",
};

/**
 * Données de la page d'administration des Équipes & Accès (super_admin).
 * Lecture via le client utilisateur : la RLS super_admin-only des tables staff_*
 * garantit qu'un non-super_admin ne lit rien (aucun contournement).
 */
export type TeamMember = { profileId: string; name: string; email: string; isLead: boolean };
export type TeamDetail = {
  id: string;
  universe: string;
  universeLabel: string;
  name: string;
  leadId: string | null;
  members: TeamMember[];
  permissions: string[];
};
export type EffectiveRight = { profileId: string; name: string; universe: string; permissions: string[] };
export type EquipesData = {
  teams: TeamDetail[];
  universes: { key: string; label: string }[];
  permissions: { permission_key: string; label: string; category: string }[];
  candidates: { id: string; name: string; email: string }[];
  effective: EffectiveRight[];
};

export async function loadEquipesAdmin(): Promise<EquipesData | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const [teamsRes, membersRes, permsRes, universesRes, catalogueRes, profilesRes] = await Promise.all([
    supabase.from("staff_teams").select("id, universe, name, lead_id").order("universe").order("name"),
    supabase.from("staff_team_members").select("team_id, profile_id, is_lead"),
    supabase.from("staff_team_permissions").select("team_id, permission_key"),
    supabase.from("universes").select("key, label").order("label"),
    supabase.from("staff_permissions").select("permission_key, label, category").order("category"),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("role", STAFF_ROLES as unknown as string[])
      .order("full_name"),
  ]);

  const universes = (universesRes.data ?? []).map((u) => ({ key: u.key as string, label: u.label as string }));
  const uLabel = new Map(universes.map((u) => [u.key, u.label]));
  const permissions = (catalogueRes.data ?? []).map((p) => ({
    permission_key: p.permission_key as string,
    // Label EN CODE (source de vérité) — le `label` DB peut être mojibaké (seed).
    label: PERMISSION_LABELS[p.permission_key as string] ?? (p.label as string),
    category: p.category as string,
  }));
  const candidates = (profilesRes.data ?? []).map((p) => ({
    id: p.id as string,
    name: (p.full_name as string) || (p.email as string) || "—",
    email: (p.email as string) ?? "",
  }));
  const nameById = new Map(candidates.map((c) => [c.id, c.name]));
  const emailById = new Map(candidates.map((c) => [c.id, c.email]));

  const membersByTeam = new Map<string, TeamMember[]>();
  for (const m of membersRes.data ?? []) {
    const arr = membersByTeam.get(m.team_id as string) ?? [];
    arr.push({
      profileId: m.profile_id as string,
      name: nameById.get(m.profile_id as string) ?? "—",
      email: emailById.get(m.profile_id as string) ?? "",
      isLead: Boolean(m.is_lead),
    });
    membersByTeam.set(m.team_id as string, arr);
  }
  const permsByTeam = new Map<string, string[]>();
  for (const p of permsRes.data ?? []) {
    const arr = permsByTeam.get(p.team_id as string) ?? [];
    arr.push(p.permission_key as string);
    permsByTeam.set(p.team_id as string, arr);
  }

  const teams: TeamDetail[] = (teamsRes.data ?? []).map((t) => ({
    id: t.id as string,
    universe: t.universe as string,
    universeLabel: uLabel.get(t.universe as string) ?? (t.universe as string),
    name: t.name as string,
    leadId: (t.lead_id as string) ?? null,
    members: membersByTeam.get(t.id as string) ?? [],
    permissions: permsByTeam.get(t.id as string) ?? [],
  }));

  // Droits EFFECTIFS par (personne, univers) = union des permissions de toutes
  // ses équipes du même univers. Chaque univers reste cloisonné.
  const effMap = new Map<string, EffectiveRight>(); // key = profileId|universe
  for (const t of teams) {
    for (const m of t.members) {
      const k = `${m.profileId}|${t.universe}`;
      const cur = effMap.get(k) ?? { profileId: m.profileId, name: m.name, universe: t.universe, permissions: [] };
      for (const p of t.permissions) if (!cur.permissions.includes(p)) cur.permissions.push(p);
      effMap.set(k, cur);
    }
  }
  const effective = Array.from(effMap.values()).sort(
    (a, b) => a.name.localeCompare(b.name) || a.universe.localeCompare(b.universe)
  );

  return { teams, universes, permissions, candidates, effective };
}
