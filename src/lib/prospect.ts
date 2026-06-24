/** Étapes du pipeline d'admission (prospects). */
export const PROSPECT_STATUS: Record<string, { label: string; cls: string; order: number }> = {
  nouveau: { label: "Nouveau", cls: "bg-blue-50 text-blue-700", order: 1 },
  contacte: { label: "Contacté", cls: "bg-indigo-50 text-indigo-700", order: 2 },
  relance: { label: "Relancé", cls: "bg-amber-50 text-amber-700", order: 3 },
  candidature: { label: "Candidature déposée", cls: "bg-purple-50 text-purple-700", order: 4 },
  inscrit: { label: "Inscrit", cls: "bg-green-600 text-white", order: 5 },
  perdu: { label: "Perdu", cls: "bg-black/10 text-black/50", order: 6 },
};

export const PROSPECT_STATUS_LIST = Object.entries(PROSPECT_STATUS)
  .sort((a, b) => a[1].order - b[1].order)
  .map(([key, v]) => ({ key, label: v.label }));

/** Format de cours souhaité. */
export const PROSPECT_FORMATS = [
  { value: "jour", label: "Cours de jour" },
  { value: "soir", label: "Cours du soir" },
  { value: "pro", label: "Pro / Week-end" },
];
export const FORMAT_LABEL: Record<string, string> = Object.fromEntries(
  PROSPECT_FORMATS.map((f) => [f.value, f.label])
);

/** Origine du prospect. */
export const PROSPECT_SOURCES = ["site", "manuel", "whatsapp", "email", "salon", "recommandation"];
