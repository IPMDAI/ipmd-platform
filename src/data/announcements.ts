/**
 * Visuels du carrousel d'accueil (annonces, événements, nouvelles formations…).
 *
 * 👉 POUR AJOUTER UN VISUEL À TOUT MOMENT :
 *   1. Dépose ton image dans le dossier `public/annonces/` (ex. `public/annonces/jpo-2026.jpg`)
 *      — ou utilise une URL d'image distante.
 *   2. Ajoute une entrée ci-dessous dans le tableau `announcements`.
 *
 * Champs :
 *   - src   : chemin de l'image (`/annonces/...`) ou URL complète (https://...)
 *   - alt   : description (accessibilité + SEO)
 *   - href  : (optionnel) lien au clic sur le visuel (ex. "/admission")
 *   - fit   : "cover" = l'image remplit le cadre (idéal pour les photos)
 *             "contain" = l'image entière est visible, sans recadrage
 *             (idéal pour une AFFICHE / un FLYER avec du texte). Défaut : "cover".
 *
 * Format conseillé pour tes affiches : paysage 16:9 (ex. 1920 × 1080 px).
 */

export interface Announcement {
  id: string;
  src: string;
  alt: string;
  href?: string;
  fit?: "cover" | "contain";
}

export const announcements: Announcement[] = [
  // ── Visuels de démarrage (à remplacer par tes propres images) ──
  {
    id: "ia-1",
    src: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=1920&q=80&auto=format&fit=crop",
    alt: "Intelligence artificielle — IPMD",
    fit: "cover",
  },
  {
    id: "ia-2",
    src: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1920&q=80&auto=format&fit=crop",
    alt: "IA générative — IPMD",
    fit: "cover",
  },
  {
    id: "ia-3",
    src: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1920&q=80&auto=format&fit=crop",
    alt: "Réseau neuronal — IPMD",
    fit: "cover",
  },

  // ── EXEMPLES à décommenter quand tu auras tes affiches ──
  // {
  //   id: "jpo-2026",
  //   src: "/annonces/jpo-2026.jpg",        // affiche déposée dans public/annonces/
  //   alt: "Journée Portes Ouvertes 2026 — IPMD",
  //   href: "/admission",
  //   fit: "contain",                       // flyer avec texte → tout visible
  // },
  // {
  //   id: "nouvelle-formation-ia",
  //   src: "/annonces/nouvelle-formation-ia.jpg",
  //   alt: "Nouvelle formation : Intelligence Artificielle",
  //   href: "/formations",
  //   fit: "contain",
  // },
];
