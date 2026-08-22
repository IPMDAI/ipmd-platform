import type { UniverseId } from "@/types";
import { dialOf, isCountry } from "@/data/countries";

/**
 * Étape 1 — « Votre identité » (internationale).
 * Champs granulaires : naissance J/M/A + pays + ville ; téléphone/WhatsApp avec
 * pays d'indicatif + numéro national. Stockage préparé : ISO-2 (pays) + E.164
 * (numéro). L'âge minimum dépend du PARCOURS (dérivé côté serveur aussi).
 */
export type Identity = {
  lastName: string;
  firstName: string;
  birthDay: string; // "01".."31"
  birthMonth: string; // "01".."12"
  birthYear: string; // "AAAA"
  birthCountry: string; // ISO-2
  birthPlace: string; // ville
  email: string;
  phoneCountry: string; // ISO-2 (indicatif)
  phone: string; // numéro national
  whatsappCountry: string; // ISO-2 (facultatif)
  whatsapp: string; // numéro national (facultatif)
};

export const EMPTY_IDENTITY: Identity = {
  lastName: "",
  firstName: "",
  birthDay: "",
  birthMonth: "",
  birthYear: "",
  birthCountry: "",
  birthPlace: "",
  email: "",
  phoneCountry: "",
  phone: "",
  whatsappCountry: "",
  whatsapp: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const digits = (s: string) => (s.match(/\d/g) ?? []).length;
// Numéro national valide : uniquement chiffres + séparateurs raisonnables
// (espaces, parenthèses, tirets, points) ET au moins 6 chiffres. Toute lettre
// (ou autre caractère) rend le numéro invalide — jamais composé en E.164.
const PHONE_ALLOWED = /^[\d\s().\-]*$/;
const isValidNationalNumber = (s: string) => PHONE_ALLOWED.test(s) && digits(s) >= 6;

/**
 * Âge minimum requis selon l'UNIVERS (règle métier définitive, jamais dérivée
 * du client). Le serveur (submit_candidature) applique exactement les mêmes seuils.
 */
export function minAgeForUniverse(universe: UniverseId | null): number {
  switch (universe) {
    case "professionnel":
      return 18;
    case "ultraboost":
    case "gouvernance":
    case "ultraexecutive":
      return 25;
    case "seniorshub":
      return 40;
    case "campus":
    case "ultrajobs":
      return 16;
    default:
      return 16; // entreprise / null (hors funnel candidature)
  }
}

/** La date (Y,M,D) est-elle une date réelle valide ? */
function isRealDate(y: number, m: number, d: number): boolean {
  if (!y || !m || !d) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

/** Date de naissance composée "YYYY-MM-DD", ou null si incomplète/invalide. */
export function composeBirthDate(v: Identity): string | null {
  const y = parseInt(v.birthYear, 10);
  const m = parseInt(v.birthMonth, 10);
  const d = parseInt(v.birthDay, 10);
  if (!isRealDate(y, m, d)) return null;
  return `${y.toString().padStart(4, "0")}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
}

/** Âge (années révolues) à aujourd'hui, ou null si date invalide. */
export function ageFromBirth(v: Identity): number | null {
  const iso = composeBirthDate(v);
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  const beforeBirthday =
    today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

/** Numéro E.164 (indicatif + national), ou null si incomplet. */
export function toE164(countryCode: string, national: string): string | null {
  const dial = dialOf(countryCode);
  const n = (national.match(/\d/g) ?? []).join("");
  if (!dial || n.length < 6) return null;
  return `${dial}${n}`;
}
export const phoneE164 = (v: Identity) => toE164(v.phoneCountry, v.phone);
export const whatsappE164 = (v: Identity) => toE164(v.whatsappCountry, v.whatsapp);

/**
 * Erreurs par champ. `minAge` vient du parcours (via minAgeForUniverse).
 * Naissance : date réelle, pas dans le futur, âge ≥ minAge.
 */
export function identityErrors(v: Identity, minAge: number): Partial<Record<keyof Identity, string>> {
  const e: Partial<Record<keyof Identity, string>> = {};

  if (!v.lastName.trim()) e.lastName = "Champ obligatoire.";
  if (!v.firstName.trim()) e.firstName = "Champ obligatoire.";
  if (!v.birthCountry || !isCountry(v.birthCountry)) e.birthCountry = "Sélectionnez un pays.";
  if (!v.birthPlace.trim()) e.birthPlace = "Champ obligatoire.";

  // Date de naissance
  if (!v.birthDay || !v.birthMonth || !v.birthYear) {
    e.birthYear = "Date de naissance incomplète.";
  } else {
    const iso = composeBirthDate(v);
    if (!iso) {
      e.birthYear = "Date de naissance invalide.";
    } else {
      const [y, m, d] = iso.split("-").map(Number);
      const today = new Date();
      const dt = new Date(y, m - 1, d);
      if (dt.getTime() > today.getTime()) {
        e.birthYear = "La date de naissance ne peut pas être dans le futur.";
      } else {
        const age = ageFromBirth(v);
        if (age != null && age < minAge) e.birthYear = `Âge minimum requis : ${minAge} ans.`;
      }
    }
  }

  if (!v.email.trim()) e.email = "Champ obligatoire.";
  else if (!EMAIL_RE.test(v.email.trim())) e.email = "Adresse email invalide.";

  if (!v.phoneCountry || !isCountry(v.phoneCountry)) e.phoneCountry = "Sélectionnez l'indicatif.";
  if (!v.phone.trim()) e.phone = "Champ obligatoire.";
  else if (!isValidNationalNumber(v.phone)) e.phone = "Numéro de téléphone invalide.";

  // WhatsApp facultatif : dès qu'un numéro est saisi, indicatif + numéro valide
  // deviennent obligatoires (mêmes règles que le téléphone, aucune lettre).
  if (v.whatsapp.trim()) {
    if (!v.whatsappCountry || !isCountry(v.whatsappCountry)) e.whatsappCountry = "Sélectionnez l'indicatif.";
    if (!isValidNationalNumber(v.whatsapp)) e.whatsapp = "Numéro WhatsApp invalide.";
  }

  return e;
}

export const isIdentityValid = (v: Identity, minAge: number): boolean =>
  Object.keys(identityErrors(v, minAge)).length === 0;
