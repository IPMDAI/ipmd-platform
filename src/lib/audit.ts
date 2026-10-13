/** Types d'action tracés dans le journal d'audit. */
export const AUDIT_ACTION_TYPES = [
  { value: "create", label: "Création" },
  { value: "update", label: "Modification" },
  { value: "validate", label: "Validation" },
  { value: "cancel", label: "Annulation" },
  { value: "archive", label: "Archivage" },
  { value: "delete", label: "Suppression" },
] as const;

export const AUDIT_ACTION_LABEL: Record<string, string> = Object.fromEntries(
  AUDIT_ACTION_TYPES.map((a) => [a.value, a.label])
);

/** Couleur du badge selon le type d'action. */
export function auditTypeBadge(type: string): string {
  switch (type) {
    case "create":
      return "bg-green-50 text-green-700 ring-1 ring-green-200";
    case "update":
    case "validate":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
    case "cancel":
    case "archive":
      return "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
    case "delete":
      return "bg-ipmd-red/10 text-ipmd-red ring-1 ring-ipmd-red/20";
    default:
      return "bg-ipmd-light text-black/50";
  }
}

type Json = Record<string, unknown> | null;

/**
 * Diff lisible entre l'ancienne et la nouvelle valeur : liste des champs qui ont
 * changé, « champ : ancien → nouveau ». Ignore quelques colonnes techniques.
 */
const DIFF_IGNORE = new Set(["id", "created_at", "updated_at"]);

export function diffFields(
  oldValue: Json,
  newValue: Json
): { key: string; from: string; to: string }[] {
  if (!oldValue && newValue) return [{ key: "", from: "—", to: "(créé)" }];
  if (oldValue && !newValue) return [{ key: "", from: "(existait)", to: "(supprimé)" }];
  if (!oldValue || !newValue) return [];
  const keys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);
  const out: { key: string; from: string; to: string }[] = [];
  for (const k of keys) {
    if (DIFF_IGNORE.has(k)) continue;
    const a = oldValue[k];
    const b = newValue[k];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      out.push({ key: k, from: fmt(a), to: fmt(b) });
    }
  }
  return out;
}

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "∅";
  if (typeof v === "string") return v.length > 60 ? v.slice(0, 60) + "…" : v;
  return JSON.stringify(v);
}
