/**
 * Formations mises en avant DANS les cartes d'univers diplômants (aperçu avant
 * clic) — section « Diplômes » de l'accueil et page /formations.
 *
 * Affichage pur (icône + libellé), volontairement indépendant du catalogue
 * interne `src/data/programs.ts` : ne modifie ni le catalogue, ni les pages
 * univers, ni la DB / les tarifs / l'admission. Clés = id d'univers.
 */
export const DIPLOMA_FORMATIONS: Record<string, { icon: string; label: string }[]> = {
  campus: [
    { icon: "📱", label: "Marketing digital" },
    { icon: "🎨", label: "Graphisme & design" },
    { icon: "📣", label: "Communication digitale" },
    { icon: "📊", label: "Management de projet digital" },
    { icon: "💳", label: "Comptabilité & finance digitale" },
    { icon: "💻", label: "Développement d'applications" },
    { icon: "🛒", label: "E-commerce & commerce international" },
    { icon: "🤖", label: "Informatique & intelligence artificielle" },
  ],
  professionnel: [
    { icon: "📱", label: "Marketing digital" },
    { icon: "🎨", label: "Graphisme & design" },
    { icon: "📣", label: "Communication digitale" },
    { icon: "📊", label: "Management de projet digital" },
    { icon: "💳", label: "Finance digitale" },
    { icon: "💻", label: "Développement d'applications" },
    { icon: "🛒", label: "E-commerce" },
    { icon: "🤖", label: "Intelligence artificielle" },
  ],
  gouvernance: [
    { icon: "📱", label: "Marketing digital" },
    { icon: "📊", label: "Management de projet digital" },
    { icon: "💳", label: "Finance digitale" },
    { icon: "🤖", label: "Intelligence artificielle" },
  ],
};
