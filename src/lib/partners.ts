export const PARTNER_CATEGORIES = [
  { value: "academique", label: "Partenaires académiques", short: "Académique", icon: "🎓" },
  { value: "entreprise", label: "Partenaires entreprises", short: "Entreprise", icon: "🏢" },
  { value: "association", label: "Partenaires associatifs", short: "Association", icon: "🤝" },
] as const;

export const PARTNER_CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  PARTNER_CATEGORIES.map((c) => [c.value, c.short])
);

export type Partner = {
  id: string;
  name: string;
  category: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  status: string;
  sort_order: number;
};
