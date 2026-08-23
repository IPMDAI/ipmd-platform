import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendScolariteEmail, sendNotification } from "@/lib/email";
import { buildCandidatureEmails } from "@/lib/candidature-email-content";

/**
 * Confirmation de candidature (Lot 1) — email candidat + notification staff,
 * après succès de `submit_candidature`.
 *
 * ⚠️ STRICTEMENT best-effort : ne lève JAMAIS. Une panne Resend, l'absence de
 * clé service-role (local) ou toute erreur de lecture ne doivent jamais
 * transformer une candidature déjà enregistrée en erreur côté candidat.
 *
 * Les données proviennent de la ligne RÉELLEMENT persistée, rechargée côté
 * serveur via le client service-role (RLS : `inscription_requests` n'est lisible
 * que par un admin). En l'absence de clé service-role (ex. environnement local),
 * on saute l'envoi sans échouer.
 */
export async function sendCandidatureConfirmation(requestId: string): Promise<void> {
  try {
    const admin = createAdminClient();
    if (!admin) return; // pas de service-role (local) → best-effort skip

    const { data, error } = await admin
      .from("inscription_requests")
      .select("id,email,full_name,universe,program_interest,entry_level,academic_year,mode")
      .eq("id", requestId)
      .single();
    if (error || !data) return;

    const built = buildCandidatureEmails(data);
    if (built.candidate) {
      await sendScolariteEmail([built.candidate.to], built.candidate.subject, built.candidate.html);
    }
    await sendNotification(built.staff.subject, built.staff.html, built.staff.replyTo);
  } catch {
    // best-effort : on n'interrompt ni ne propage jamais.
  }
}
