import { redirect } from "next/navigation";

/**
 * Le wizard est désormais servi directement sur /admission (bascule effectuée).
 * Cette route de préversion redirige vers la page canonique pour éviter tout
 * contenu dupliqué et garder les anciens liens fonctionnels.
 */
export default function AdmissionWizardPage() {
  redirect("/admission");
}
