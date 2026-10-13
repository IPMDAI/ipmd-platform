/** Vie IPMD — constantes partagées. */
export const EVENT_KINDS = [
  { value: "jpo", label: "Journée Portes Ouvertes", icon: "🚪" },
  { value: "conference", label: "Conférence", icon: "🎤" },
  { value: "ceremonie", label: "Cérémonie", icon: "🎓" },
  { value: "panel", label: "Panel", icon: "🧑‍🏫" },
  { value: "networking", label: "Networking", icon: "🤝" },
  { value: "autre", label: "Événement", icon: "🎉" },
] as const;
export const EVENT_KIND_VALUES: string[] = EVENT_KINDS.map((k) => k.value);
export const EVENT_KIND: Record<string, { label: string; icon: string }> =
  Object.fromEntries(EVENT_KINDS.map((k) => [k.value, { label: k.label, icon: k.icon }]));

export const EVENT_STATUS: Record<string, { label: string; cls: string }> = {
  brouillon: { label: "Brouillon", cls: "bg-amber-50 text-amber-800" },
  publie: { label: "Publié", cls: "bg-green-50 text-green-700" },
  annule: { label: "Annulé", cls: "bg-ipmd-red/10 text-ipmd-red" },
};

export const EVENT_AUDIENCES = [
  { value: "all", label: "Tout le monde" },
  { value: "parent", label: "Parents" },
  { value: "etudiant", label: "Étudiants" },
] as const;
export const EVENT_AUDIENCE_LABEL: Record<string, string> = Object.fromEntries(
  EVENT_AUDIENCES.map((a) => [a.value, a.label])
);

export const RSVP_OPTIONS = [
  { value: "oui", label: "Je participe", cls: "bg-green-600 text-white" },
  { value: "peut_etre", label: "Peut-être", cls: "bg-amber-500 text-white" },
  { value: "non", label: "Je ne peux pas", cls: "bg-black/60 text-white" },
] as const;
export const RSVP_LABEL: Record<string, string> = Object.fromEntries(
  RSVP_OPTIONS.map((r) => [r.value, r.label])
);

export type EventItem = {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  audience: string;
  status: string;
  registration_deadline: string | null;
  capacity: number | null;
};

/** La limite d'inscription est-elle dépassée ? */
export function deadlinePassed(ev: Pick<EventItem, "registration_deadline">): boolean {
  return !!ev.registration_deadline && new Date(ev.registration_deadline) <= new Date();
}

/** Peut-on encore répondre (publié + avant la limite) ? (la capacité est vérifiée à part) */
export function registrationOpen(ev: Pick<EventItem, "status" | "registration_deadline">): boolean {
  return ev.status === "publie" && !deadlinePassed(ev);
}

/** Date/heure d'un événement au format FR lisible. */
export function eventWhen(startsAt: string, endsAt: string | null): string {
  const s = new Date(startsAt);
  const start = s.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
  if (!endsAt) return start;
  const e = new Date(endsAt);
  const sameDay = s.toDateString() === e.toDateString();
  const end = sameDay
    ? e.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : e.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
  return `${start} → ${end}`;
}
