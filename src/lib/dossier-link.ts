import crypto from "crypto";

/**
 * Lien signé « Compléter mon dossier ».
 *
 * Un candidat (non connecté) reçoit par email un lien unique contenant un jeton
 * signé (HMAC-SHA256) qui encode l'identifiant de sa candidature. La page
 * /completer-dossier revalide la signature — impossible à falsifier ou à
 * deviner sans la clé secrète. Aucune donnée sensible n'est exposée (l'id est
 * un UUID opaque).
 *
 * ⚠️ Utilise la même clé que les documents officiels (IPMD_DOC_SECRET).
 */
const SECRET = process.env.IPMD_DOC_SECRET || "ipmd-dev-doc-secret-change-me";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://ipmd.pro"
).replace(/\/$/, "");

function b64urlEncode(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(input: string): string {
  return Buffer.from(
    input.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  ).toString("utf8");
}

function sign(data: string): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Jeton signé pour une candidature (« data.signature »). */
export function signDossierToken(candidatureId: string): string {
  const data = b64urlEncode(candidatureId);
  return `${data}.${sign(data)}`;
}

/** Revalide un jeton : renvoie l'id de candidature si la signature est valide. */
export function verifyDossierToken(token: string): string | null {
  const [data, sig] = (token || "").split(".");
  if (!data || !sig) return null;
  const expected = sign(data);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return b64urlDecode(data);
  } catch {
    return null;
  }
}

/** URL publique « Compléter mon dossier » à envoyer au candidat. */
export function dossierLinkUrl(candidatureId: string): string {
  return `${SITE_URL}/completer-dossier?t=${signDossierToken(candidatureId)}`;
}
