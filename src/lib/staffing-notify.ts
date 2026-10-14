import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { canSendEmail, sendEmailTo } from "@/lib/email";
import { NEED_TYPE_LABEL, PRIORITY_LABEL } from "@/lib/staffing";
import { buildStaffingEmail, type StaffingEvent } from "@/lib/staffing-email";

/**
 * Notifications « Besoins en personnel » (D6-4) — réutilise l'infrastructure
 * email IPMD existante (Resend via src/lib/email.ts). AUCUNE nouvelle infra,
 * aucun droit ni transition modifiés. Déclenchées APRÈS une transition réussie,
 * BEST-EFFORT : un échec d'envoi n'annule jamais la décision métier (la RPC a
 * déjà commité). Aucune donnée financière/sensible. Destinataires résolus via
 * service-role (createAdminClient) car ni le DÉ ni l'AG `admin` ne lisent
 * largement les profils en RLS ; no-op propre si non configuré (local).
 */
export type { StaffingEvent } from "@/lib/staffing-email";

export async function notifyStaffing(besoinId: string, event: StaffingEvent): Promise<void> {
  if (!canSendEmail) return;
  try {
    const admin = createAdminClient();
    if (!admin) return; // local / non configuré : no-op

    const { data: b } = await admin
      .from("staffing_requests")
      .select(
        "requester_id, requester_name, position_title, need_type, priority, academic_year, decision_reason, assigned_profile_name"
      )
      .eq("id", besoinId)
      .maybeSingle();
    if (!b) return;

    // Soumission → l'AG (tous admin/super_admin) ; sinon le DÉ demandeur.
    let recipients: string[] = [];
    if (event === "submitted") {
      const { data: ags } = await admin
        .from("profiles")
        .select("email")
        .in("role", ["admin", "super_admin"]);
      recipients = (ags ?? []).map((a) => a.email as string).filter(Boolean);
    } else {
      const { data: de } = await admin
        .from("profiles")
        .select("email")
        .eq("id", b.requester_id)
        .maybeSingle();
      if (de?.email) recipients = [de.email];
    }
    if (recipients.length === 0) return;

    const { subject, html } = buildStaffingEmail(event, {
      positionTitle: b.position_title,
      needTypeLabel: NEED_TYPE_LABEL[b.need_type] ?? b.need_type,
      priorityLabel: PRIORITY_LABEL[b.priority] ?? b.priority,
      academicYear: b.academic_year,
      requesterName: b.requester_name,
      reason: b.decision_reason,
      assignedName: b.assigned_profile_name,
    });
    await sendEmailTo(recipients, subject, html);
  } catch {
    // best-effort : jamais bloquant
  }
}
