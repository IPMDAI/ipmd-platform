/** Statuts d'une candidature enseignant. */
export const APPLICATION_STATUSES: { value: string; label: string }[] = [
  { value: "nouveau", label: "Nouveau" },
  { value: "entretien", label: "Entretien" },
  { value: "retenu", label: "Retenu" },
  { value: "contrat_envoye", label: "Contrat envoyé" },
  { value: "contrat_signe", label: "Contrat signé" },
  { value: "refuse", label: "Refusé" },
];

export const APPLICATION_STATUS_VALUES = APPLICATION_STATUSES.map(
  (s) => s.value
);

export const APPLICATION_STATUS_LABELS: Record<string, string> =
  Object.fromEntries(APPLICATION_STATUSES.map((s) => [s.value, s.label]));
