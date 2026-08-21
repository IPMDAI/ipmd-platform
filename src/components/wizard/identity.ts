/**
 * Étape 1 — « Votre identité ».
 * Modèle + validation SIMPLE (champs obligatoires non vides + email plausible).
 * Aucun « Profil souhaité » ici : le programme visé relève de l'Étape 3 (Projet).
 */
export type Identity = {
  lastName: string; // Nom *
  firstName: string; // Prénoms *
  birthDate: string; // Date de naissance * (YYYY-MM-DD)
  birthPlace: string; // Lieu de naissance *
  email: string; // Email *
  phone: string; // Téléphone *
  whatsapp: string; // WhatsApp (facultatif)
};

export const EMPTY_IDENTITY: Identity = {
  lastName: "",
  firstName: "",
  birthDate: "",
  birthPlace: "",
  email: "",
  phone: "",
  whatsapp: "",
};

/** Champs obligatoires de l'Étape 1. */
export const IDENTITY_REQUIRED: (keyof Identity)[] = [
  "lastName",
  "firstName",
  "birthDate",
  "birthPlace",
  "email",
  "phone",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DIGITS_RE = /\d/g;

/**
 * Erreurs par champ (message court). Un champ absent de l'objet = valide.
 * Validation volontairement légère : obligatoire non vide, email au bon format,
 * téléphone contenant au moins 6 chiffres.
 */
export function identityErrors(v: Identity): Partial<Record<keyof Identity, string>> {
  const e: Partial<Record<keyof Identity, string>> = {};
  for (const k of IDENTITY_REQUIRED) {
    if (!v[k].trim()) e[k] = "Champ obligatoire.";
  }
  if (v.email.trim() && !EMAIL_RE.test(v.email.trim())) e.email = "Adresse email invalide.";
  if (v.phone.trim() && (v.phone.match(DIGITS_RE)?.length ?? 0) < 6)
    e.phone = "Numéro de téléphone invalide.";
  return e;
}

export const isIdentityValid = (v: Identity): boolean =>
  Object.keys(identityErrors(v)).length === 0;
