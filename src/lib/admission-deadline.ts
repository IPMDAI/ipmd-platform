/**
 * Deadline d'admission (72 h) — module PUR (aucun accès DB), utilisable
 * serveur ET client.
 *
 * Le délai de règlement des frais d'inscription court à partir de
 * `inscription_requests.admission_sent_at` (ancre du délai courant, remise à
 * l'envoi réel ET à chaque renouvellement admin silencieux). Aucune deadline
 * n'est stockée : elle est TOUJOURS calculée = admission_sent_at + 72 h.
 */

export const ADMISSION_PAYMENT_DEADLINE_HOURS = 72;

/** Date limite de règlement = admission_sent_at + 72 h (calendaires). */
export function computeAdmissionDeadline(admissionSentAt: string | null | undefined): Date | null {
  if (!admissionSentAt) return null;
  const t = new Date(admissionSentAt).getTime();
  if (!Number.isFinite(t)) return null;
  return new Date(t + ADMISSION_PAYMENT_DEADLINE_HOURS * 3600 * 1000);
}

/** Le délai est-il dépassé ? (faux si aucune ancre). */
export function isAdmissionExpired(
  admissionSentAt: string | null | undefined,
  now: Date = new Date()
): boolean {
  const d = computeAdmissionDeadline(admissionSentAt);
  return d != null && now.getTime() > d.getTime();
}

/** Format candidat, heure d'Abidjan (UTC) : « au plus tard le 26/08/2026 à 14h30 ». */
export function formatAdmissionDeadline(d: Date | null): string | null {
  if (!d) return null;
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Abidjan",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `au plus tard le ${get("day")}/${get("month")}/${get("year")} à ${get("hour")}h${get("minute")}`;
}

/** Raccourci : texte de deadline directement depuis l'ancre (ou null). */
export function admissionDeadlineText(admissionSentAt: string | null | undefined): string | null {
  return formatAdmissionDeadline(computeAdmissionDeadline(admissionSentAt));
}

/** Message candidat affiché quand le délai est dépassé. */
export const ADMISSION_EXPIRED_MESSAGE =
  "Le délai de confirmation de votre admission est dépassé. Votre place n'est plus garantie. Merci de contacter le service des admissions avant tout règlement.";
