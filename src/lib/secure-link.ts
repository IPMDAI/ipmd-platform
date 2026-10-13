import crypto from "crypto";

/**
 * Lien SÉCURISÉ vers l'espace pour données sensibles (notes, absences, finances).
 * L'email ne contient JAMAIS la donnée : seulement une notification + ce lien signé
 * (HMAC-SHA256) et expirant. À l'ouverture, /espace/acces revalide la signature,
 * exige la connexion, vérifie l'accès (RLS : parent/étudiant/admin), puis redirige.
 *
 * ⚠️ Prod : définir IPMD_DOC_SECRET (Vercel). Clé de dev par défaut sinon.
 */
const SECRET = process.env.IPMD_DOC_SECRET || "ipmd-dev-doc-secret-change-me";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://ipmd.pro").replace(/\/$/, "");

export type SecureLinkKind = "note" | "absence" | "finance" | "convocation" | "document";

export type SecureLinkPayload = {
  s: string; // student_id
  k: SecureLinkKind; // nature de l'information
  exp: number; // expiration (unix secondes)
};

function b64url(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
function b64urlDecode(input: string): string {
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
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

/** Jeton signé « data.signature ». Durée par défaut : 14 jours. */
export function signSecureLink(
  studentId: string,
  kind: SecureLinkKind,
  ttlSeconds = 14 * 24 * 3600
): string {
  const payload: SecureLinkPayload = {
    s: studentId,
    k: kind,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const data = b64url(JSON.stringify(payload));
  return `${data}.${sign(data)}`;
}

/** Revalide un jeton : charge utile si signature valide ET non expirée. */
export function verifySecureLink(token: string): SecureLinkPayload | null {
  const [data, sig] = (token || "").split(".");
  if (!data || !sig) return null;
  const expected = sign(data);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(b64urlDecode(data)) as SecureLinkPayload;
    if (!payload.s || !payload.exp || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** URL complète du lien sécurisé (à mettre dans l'email). */
export function secureLinkUrl(studentId: string, kind: SecureLinkKind): string {
  return `${SITE_URL}/espace/acces?t=${signSecureLink(studentId, kind)}`;
}
