/**
 * Définition des 6 étapes (0→5) du wizard d'admission.
 *
 * Étapes 0 (« Parcours IPMD ») et 1 (« Votre identité ») implémentées ; les
 * étapes 2→5 sont déclarées ici (pour le fil d'Ariane / stepper) mais rendues
 * comme placeholders tant qu'elles ne sont pas validées. La structure reste
 * stable pour brancher chaque étape sans réécrire la coquille.
 *
 * Logique : l'identité (1) et le parcours DÉJÀ ACQUIS (2) sont distincts du
 * PROJET / programme souhaité (3) — on ne mélange pas les deux.
 */
export type WizardStepKey =
  | "parcours"
  | "identite"
  | "parcours_actuel"
  | "projet"
  | "pieces"
  | "recap";

export type WizardStep = {
  key: WizardStepKey;
  /** Titre complet (en-tête d'étape + « Étape n/6 » mobile). */
  label: string;
  /** Libellé court pour les pastilles du stepper desktop. */
  short: string;
  /** Sous-titre court explicatif. */
  hint: string;
  /** Déjà implémentée ? (les autres affichent un placeholder). */
  ready: boolean;
};

export const WIZARD_STEPS: WizardStep[] = [
  { key: "parcours", label: "Parcours IPMD", short: "Parcours", hint: "Choisissez votre univers de formation", ready: true },
  { key: "identite", label: "Votre identité", short: "Identité", hint: "Vos informations personnelles", ready: true },
  { key: "parcours_actuel", label: "Votre parcours actuel", short: "Parcours actuel", hint: "Votre parcours académique et professionnel déjà acquis", ready: false },
  { key: "projet", label: "Votre projet à l'IPMD", short: "Projet", hint: "Le programme souhaité et vos motivations", ready: false },
  { key: "pieces", label: "Pièces justificatives", short: "Pièces", hint: "Documents requis pour votre dossier", ready: false },
  { key: "recap", label: "Récapitulatif & envoi", short: "Récap.", hint: "Vérifiez puis envoyez votre demande", ready: false },
];

export const STEP_COUNT = WIZARD_STEPS.length; // 6
