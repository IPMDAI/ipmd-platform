/**
 * Établissements d'origine — liste d'aide à la saisie (Étape 2, « Établissement
 * d'origine »). Utilisée comme suggestions d'un champ de recherche/autocomplétion
 * (<datalist>) : le candidat peut choisir un établissement connu OU saisir
 * librement le sien (« Autre établissement »).
 *
 * ⚠️ Volontairement NON exhaustive et maintenable à la main — ce n'est pas un
 * référentiel mondial. On privilégie les établissements ivoiriens les plus
 * fréquents ; toute autre saisie reste possible en texte libre.
 */
export const KNOWN_INSTITUTIONS: string[] = [
  "Université Félix Houphouët-Boigny (Cocody)",
  "Université Nangui Abrogoua (Abobo-Adjamé)",
  "Université Alassane Ouattara (Bouaké)",
  "Université Péléforo Gon Coulibaly (Korhogo)",
  "Université Jean Lorougnon Guédé (Daloa)",
  "INP-HB (Yamoussoukro)",
  "ESATIC",
  "Université Virtuelle de Côte d'Ivoire (UVCI)",
  "IUA — Institut Universitaire d'Abidjan",
  "ISTC Polytechnique",
  "Groupe CSI-Pôle Polytechnique",
  "PIGIER Côte d'Ivoire",
  "Groupe HECI",
  "ESCA",
  "Sup'Management Côte d'Ivoire",
  "Université de l'Atlantique",
  "Université Méthodiste de Côte d'Ivoire",
  "Groupe Loko",
  "IPNETP",
  "Lycée / Établissement d'enseignement secondaire",
];
