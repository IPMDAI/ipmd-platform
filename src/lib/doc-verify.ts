import crypto from "crypto";

/**
 * Vérification anti-faux des documents officiels IPMD.
 * Le QR code encode une charge utile signée (HMAC-SHA256) : impossible à
 * falsifier sans la clé secrète. La page /verifier revalide la signature
 * sans base de données.
 *
 * ⚠️ En production, définir IPMD_DOC_SECRET (Vercel) — sinon la clé par
 * défaut ci-dessous est utilisée (suffisante pour le développement).
 */
const SECRET =
  process.env.IPMD_DOC_SECRET || "ipmd-dev-doc-secret-change-me";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://ipmd.pro"
).replace(/\/$/, "");

export type DocPayload = {
  t: string; // type de document (slug)
  m: string; // matricule
  n: string; // nom complet
  y: string; // année académique
  a?: number | null; // moyenne (réussite) OU montant (reçu)
  me?: string; // mention (réussite)
  d?: string; // date (reçu de paiement)
};

function b64urlEncode(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(input: string): string {
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
    "utf8"
  );
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

/** Construit le jeton signé « data.signature ». */
export function signDoc(payload: DocPayload): string {
  const data = b64urlEncode(JSON.stringify(payload));
  return `${data}.${sign(data)}`;
}

/** Revalide un jeton : renvoie la charge utile si la signature est valide. */
export function verifyDoc(token: string): DocPayload | null {
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = sign(data);
  // Comparaison à temps constant.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(b64urlDecode(data)) as DocPayload;
  } catch {
    return null;
  }
}

/** URL publique de vérification (encodée dans le QR code). */
export function verifyUrl(token: string): string {
  return `${SITE_URL}/verifier?d=${token}`;
}
