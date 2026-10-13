/**
 * Lien « définir mon mot de passe » ROBUSTE aux scanners d'emails.
 *
 * Problème : le lien d'action Supabase (/auth/v1/verify?token=…) est à USAGE UNIQUE.
 * Les scanners de sécurité (Gmail, Outlook, antivirus) pré-cliquent les liens pour
 * les analyser → le jeton est consommé AVANT que l'utilisateur ne clique → « lien
 * invalide/expiré ».
 *
 * Solution : on envoie un lien vers NOTRE page avec le `token_hash`. La page appelle
 * `verifyOtp({ token_hash })` en JavaScript (côté navigateur réel) — un scanner qui
 * fait un simple GET n'exécute pas ce JS et ne consomme donc pas le jeton.
 */
type GenLink = { properties?: { hashed_token?: string | null } | null } | null;

export function passwordSetupLink(siteUrl: string, linkData: GenLink): string {
  const h = linkData?.properties?.hashed_token;
  const base = siteUrl.replace(/\/$/, "");
  return h
    ? `${base}/definir-mot-de-passe?token_hash=${encodeURIComponent(h)}&type=recovery`
    : `${base}/mot-de-passe-oublie`;
}
