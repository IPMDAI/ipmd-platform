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

/** Durée de validité par défaut d'un lien (jours). */
export const DOSSIER_LINK_TTL_DAYS = 30;

export type DossierTokenPayload = { candidatureId: string; version: number; exp: number };

/**
 * Jeton signé v2 : encode `candidatureId | version | exp` (HMAC).
 *  - `version` = `inscription_requests.dossier_token_version` → RÉVOCATION
 *    (incrémenter la version invalide tous les liens émis avant) ;
 *  - `exp` = horodatage d'EXPIRATION (ms) → le lien cesse d'être valide après ;
 *  - l'id de candidature est le SEUL dossier accessible via ce jeton (accès limité).
 */
export function signDossierToken(
  candidatureId: string,
  version = 1,
  ttlDays = DOSSIER_LINK_TTL_DAYS
): string {
  const exp = Date.now() + ttlDays * 24 * 60 * 60 * 1000;
  const data = b64urlEncode(`${candidatureId}|${version}|${exp}`);
  return `${data}.${sign(data)}`;
}

/**
 * Revalide un jeton : signature + expiration. Renvoie le payload (candidatureId,
 * version, exp) ou `null`. ⚠️ La RÉVOCATION (comparaison de `version` à la valeur
 * courante en base) est vérifiée par l'appelant serveur, qui seul connaît l'état.
 */
export function verifyDossierToken(token: string): DossierTokenPayload | null {
  const [data, sig] = (token || "").split(".");
  if (!data || !sig) return null;
  const expected = sign(data);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const raw = b64urlDecode(data);
    const parts = raw.split("|");
    // Rétrocompat : ancien jeton = id seul (pas de version/exp) → refusé (exp/révoc exigées).
    if (parts.length !== 3) return null;
    const [candidatureId, versionStr, expStr] = parts;
    const version = Number(versionStr);
    const exp = Number(expStr);
    if (!candidatureId || !Number.isFinite(version) || !Number.isFinite(exp)) return null;
    if (Date.now() > exp) return null; // expiré
    return { candidatureId, version, exp };
  } catch {
    return null;
  }
}

/** URL publique « Compléter mon dossier » à envoyer au candidat. */
export function dossierLinkUrl(candidatureId: string, version = 1, ttlDays = DOSSIER_LINK_TTL_DAYS): string {
  return `${SITE_URL}/completer-dossier?t=${signDossierToken(candidatureId, version, ttlDays)}`;
}
