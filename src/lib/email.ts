/**
 * Notifications email via Resend (https://resend.com).
 *
 * Best-effort : si les clés ne sont pas configurées ou si l'envoi échoue,
 * on n'interrompt JAMAIS la soumission du formulaire (la demande reste
 * enregistrée dans Supabase). L'email n'est qu'une notification.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const RESEND_FROM = process.env.RESEND_FROM ?? "IPMD <onboarding@resend.dev>";
const RESEND_TO = process.env.RESEND_TO ?? "";

export const isEmailConfigured =
  RESEND_API_KEY.length > 0 && RESEND_TO.length > 0;

/** Échappe le HTML pour éviter toute injection dans l'email. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Construit un tableau HTML simple à partir de paires libellé/valeur. */
export function buildRows(fields: Array<[string, string | null | undefined]>): string {
  return fields
    .filter(([, v]) => v)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px;color:#6b7280;font-weight:600;white-space:nowrap">${esc(
          label
        )}</td><td style="padding:6px 12px;color:#0b0b0d">${esc(
          String(value)
        )}</td></tr>`
    )
    .join("");
}

/** Enveloppe le contenu dans une mise en page email aux couleurs IPMD. */
export function emailLayout(title: string, rows: string): string {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f6f7f9;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eceef1">
    <div style="background:#0b0b0d;padding:20px 24px">
      <span style="color:#fff;font-size:18px;font-weight:800">IPMD</span>
      <span style="color:#e01228;font-size:18px;font-weight:800"> ·</span>
      <span style="color:#9ca3af;font-size:13px"> Notification</span>
    </div>
    <div style="padding:24px">
      <h1 style="margin:0 0 16px;font-size:18px;color:#0b0b0d">${esc(title)}</h1>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
    </div>
    <div style="padding:14px 24px;background:#f6f7f9;color:#9ca3af;font-size:12px">
      Email automatique — www.ipmd.pro
    </div>
  </div>
</div>`;
}

/** Envoie un email de notification. Ne lève jamais d'exception. */
export async function sendNotification(
  subject: string,
  html: string,
  replyTo?: string
): Promise<void> {
  if (!isEmailConfigured) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: RESEND_TO.split(",").map((s) => s.trim()),
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
  } catch {
    // Best-effort : on ignore les erreurs d'envoi.
  }
}
