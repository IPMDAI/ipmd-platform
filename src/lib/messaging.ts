/** Motifs d'un message à l'administration. */
export const MESSAGE_CATEGORIES = [
  { value: "question", label: "Question générale" },
  { value: "absence", label: "Justifier une absence" },
  { value: "finance", label: "Scolarité / paiement" },
  { value: "pedagogie", label: "Pédagogie / cours" },
  { value: "autre", label: "Autre" },
] as const;

export const MESSAGE_CATEGORY_VALUES: string[] = MESSAGE_CATEGORIES.map(
  (c) => c.value
);

export const MESSAGE_CATEGORY_LABEL: Record<string, string> =
  Object.fromEntries(MESSAGE_CATEGORIES.map((c) => [c.value, c.label]));
