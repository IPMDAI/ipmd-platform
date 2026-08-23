import { verifyPackToken } from "@/lib/admission-pack-link";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSchedulePdf } from "@/lib/admission-pdf";
import { validateScheduleSnapshot } from "@/lib/admission-schedule";
import { TEST_MODE } from "@/lib/admission-config";

export const runtime = "nodejs";

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .toLowerCase();
}

/**
 * Télécharge l'ÉCHÉANCIER de paiement d'un pack (Lot Finance F7), via un lien
 * signé (sans compte). Généré À LA DEMANDE depuis le `schedule_json` COURANT du
 * pack → reflète toujours l'option choisie ; aucune version stockée. Si le
 * snapshot est absent/invalide → 404 (pas de faux échéancier).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t") || "";
  const link = await verifyPackToken(token);
  if (!link) return new Response("Lien invalide ou expiré.", { status: 404 });

  const admin = createAdminClient();
  if (!admin) return new Response("Service indisponible.", { status: 503 });

  const { data: pack } = await admin
    .from("admission_packs")
    .select("candidature_id, schedule_json")
    .eq("id", link.packId)
    .single();
  if (!pack) return new Response("Pack introuvable.", { status: 404 });

  const check = validateScheduleSnapshot(pack.schedule_json);
  if (!check.ok) {
    return new Response(
      "Échéancier non disponible : choisissez d'abord votre option de paiement dans votre espace d'admission.",
      { status: 404 }
    );
  }

  const { data: cand } = await admin
    .from("inscription_requests")
    .select("full_name, program_interest")
    .eq("id", pack.candidature_id)
    .single();

  const pdf = await buildSchedulePdf({
    name: (cand?.full_name as string) ?? "",
    program: (cand?.program_interest as string) ?? null,
    schedule: check.snap,
    testMode: TEST_MODE,
  });

  const base = slugify(`${cand?.full_name ?? "echeancier"}`) || "echeancier";
  const filename = `${TEST_MODE ? "TEST-" : ""}echeancier-${base}.pdf`;

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
