import { recordAndSendReglementAcceptance } from "@/lib/reglement-emails";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// ⚠️ ENDPOINT DE RECETTE TEMPORAIRE — à SUPPRIMER après validation.
// Strictement limité au dossier de test et au sink Resend (aucun vrai destinataire).
const TEST_CAND = "839ae273-fc1f-45a3-ade6-6d2479862383";
const TEST_PACK = "48b4ebaa-2ddc-4694-8e82-426bd40944d9";
const SINK = "delivered@resend.dev";
const VERSION = "diplome-2026-2027-r2";
const DEDUP = `pack:${TEST_PACK}:${VERSION}`;

export async function GET() {
  await recordAndSendReglementAcceptance({
    scope: "pack",
    dedupKey: DEDUP,
    candidatureId: TEST_CAND,
    userId: null,
    recipient: SINK,
    name: "RECETTE Reglement Email",
    parcours: "diplome",
    version: VERSION,
    acceptedAt: new Date(),
  });

  const admin = createAdminClient();
  const { data } = admin
    ? await admin
        .from("reglement_emails")
        .select("status, provider_message_id, error, attempts, recipient, parcours, version, sent_at")
        .eq("dedup_key", DEDUP)
        .maybeSingle()
    : { data: null };

  return Response.json({ ok: true, record: data });
}
