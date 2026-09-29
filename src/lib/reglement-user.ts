import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReglement, type ReglementSet } from "@/data/reglement";
import {
  decideIsBootcamp,
  universeMismatch,
  type BootcampSignals,
} from "@/lib/reglement-parcours";

/** Collecte les signaux du parcours pour l'utilisateur courant (server-only). */
async function loadSignals(userId: string): Promise<BootcampSignals> {
  const admin = createAdminClient();
  if (!admin) return { profileUniverse: null, candidatureUniverse: null, lumpSumEligible: null };

  const { data: prof } = await admin
    .from("profiles")
    .select("universe, candidature_id")
    .eq("id", userId)
    .maybeSingle();

  let candidatureUniverse: string | null = null;
  if (prof?.candidature_id) {
    const { data: cand } = await admin
      .from("inscription_requests")
      .select("universe")
      .eq("id", prof.candidature_id as string)
      .maybeSingle();
    candidatureUniverse = (cand?.universe as string | null) ?? null;
  }

  let lumpSumEligible: boolean | null = null;
  // N'interroger la finance que si aucun signal de parcours n'est disponible.
  if (!candidatureUniverse && !prof?.universe) {
    const { data: fin } = await admin
      .from("student_finance")
      .select("lump_sum_eligible")
      .eq("student_id", userId)
      .maybeSingle();
    lumpSumEligible = (fin as { lump_sum_eligible?: boolean } | null)?.lump_sum_eligible ?? null;
  }

  return {
    profileUniverse: (prof?.universe as string | null) ?? null,
    candidatureUniverse,
    lumpSumEligible,
  };
}

/**
 * Détermine si l'espace d'un utilisateur relève d'un parcours BOOTCAMP / CERTIFIANT,
 * par le PARCOURS du candidat (jamais uniquement par la finance).
 */
export async function resolveUserIsBootcamp(userId: string): Promise<boolean> {
  const signals = await loadSignals(userId);
  if (universeMismatch(signals)) {
    // Observabilité : la candidature tranche, mais l'écart doit être corrigé côté données.
    console.warn(
      `[reglement] universe mismatch user=${userId} profile=${signals.profileUniverse} candidature=${signals.candidatureUniverse} → candidature prime`
    );
  }
  return decideIsBootcamp(signals);
}

/** Jeu de règlement (titre/année/version/articles) applicable à un utilisateur. */
export async function getReglementForUser(userId: string): Promise<ReglementSet> {
  return getReglement(await resolveUserIsBootcamp(userId));
}
