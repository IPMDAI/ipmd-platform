import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  canSendEmail,
  emailDocument,
  escapeHtml,
  sendScolariteEmail,
} from "@/lib/email";
import { secureLinkUrl, type SecureLinkKind } from "@/lib/secure-link";

const KIND: Record<string, { subject: string; phrase: string }> = {
  note: { subject: "IPMD — Nouvelle note disponible", phrase: "Une nouvelle note" },
  absence: { subject: "IPMD — Absence signalée", phrase: "Une absence" },
  finance: {
    subject: "IPMD — Information de scolarité",
    phrase: "Une information de scolarité",
  },
};

/**
 * Notifie les parents (+ l'étudiant) d'une information SENSIBLE, SANS inclure la
 * donnée : seulement une notification + un lien signé vers l'espace. Best-effort :
 * ne bloque ni ne fait échouer l'action source (ajout de note, appel, etc.).
 * Lecture des destinataires via service-role (prod) ; no-op propre en local.
 */
export async function notifySensitive(
  studentId: string,
  kind: SecureLinkKind
): Promise<void> {
  if (!canSendEmail) return;
  try {
    const lookup = createAdminClient() ?? (await createClient());
    if (!lookup) return;

    const { data: stu } = await lookup
      .from("profiles")
      .select("email, full_name")
      .eq("id", studentId)
      .maybeSingle();
    const { data: links } = await lookup
      .from("parent_links")
      .select("parent_id")
      .eq("student_id", studentId);
    const ids = (links ?? []).map((l) => l.parent_id);

    const emails: string[] = [];
    if (stu?.email) emails.push(stu.email);
    if (ids.length > 0) {
      const { data: ps } = await lookup
        .from("profiles")
        .select("email")
        .in("id", ids);
      for (const p of ps ?? []) if (p.email) emails.push(p.email);
    }
    if (emails.length === 0) return;

    const meta = KIND[kind] ?? KIND.note;
    const link = secureLinkUrl(studentId, kind);
    const html = emailDocument(
      "Information IPMD",
      `<p style="font-size:14px;color:#374151">Bonjour,</p>
       <p style="font-size:14px;color:#374151">${meta.phrase} concernant <strong>${escapeHtml(
         stu?.full_name ?? "votre enfant"
       )}</strong> est disponible dans votre espace IPMD.</p>
       <p style="font-size:13px;color:#6b7280">Pour des raisons de confidentialité, le détail n'est pas inclus dans cet email.</p>
       <p style="text-align:center;margin:24px 0"><a href="${link}" style="background:#e4002b;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block">Consulter dans mon espace</a></p>`
    );
    await sendScolariteEmail(emails, meta.subject, html);
  } catch {
    // best-effort
  }
}
