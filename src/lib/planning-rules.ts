/**
 * Règles de programmation IPMD (B4) — logique pure, testable.
 * Le vrai calendrier (fériés / vacances / examens) BLOQUE ; les préférences de
 * jour ne font qu'ALERTER. Une dérogation ne vaut que pour une séance précise,
 * motivée, par un rôle autorisé (traçée côté serveur).
 */

/** Types « réguliers » suspendus pendant les examens (blocks_regular). */
export const REGULAR_TYPES = ["cours", "td", "tp"];

/** Seuls ces rôles peuvent autoriser une exception sur une date bloquée. */
export const AUTHORIZED_EXCEPTION_ROLES = ["admin", "super_admin", "pedagogie"];

export type CalendarPeriod = {
  start_date: string;
  end_date: string;
  blocks_all: boolean;
  blocks_regular: boolean;
};

/**
 * Motif de blocage d'une date pour un type de séance, ou null si libre.
 * Miroir JS de la fonction SQL planning_block_reason (dates ISO AAAA-MM-JJ).
 */
export function blockReasonFor(
  date: string,
  type: string,
  holidays: Set<string>,
  periods: CalendarPeriod[]
): string | null {
  if (holidays.has(date)) return "Jour férié";
  for (const p of periods) {
    if (date < p.start_date || date > p.end_date) continue;
    if (p.blocks_all) return "Vacances / fermeture";
    if (p.blocks_regular && REGULAR_TYPES.includes(type)) {
      return "Examens : cours réguliers suspendus";
    }
  }
  return null;
}

/**
 * Décide si une séance peut être programmée sur une date potentiellement bloquée.
 * - date libre → autorisée ;
 * - date bloquée sans motif → refus ;
 * - date bloquée + motif mais rôle non autorisé → refus ;
 * - date bloquée + motif + rôle autorisé → autorisée AVEC exception (à tracer).
 */
export function resolveScheduling(input: {
  blockReason: string | null;
  exceptionReason?: string | null;
  actorRole: string;
}): { allowed: boolean; message?: string; withException: boolean } {
  if (!input.blockReason) return { allowed: true, withException: false };
  const reason = (input.exceptionReason ?? "").trim();
  if (!reason) {
    return {
      allowed: false,
      withException: false,
      message: `Date bloquée (${input.blockReason}). Un motif d'exception est requis.`,
    };
  }
  if (!AUTHORIZED_EXCEPTION_ROLES.includes(input.actorRole)) {
    return {
      allowed: false,
      withException: false,
      message: "Exception réservée aux rôles autorisés (admin / super_admin / pédagogie).",
    };
  }
  return { allowed: true, withException: true };
}
