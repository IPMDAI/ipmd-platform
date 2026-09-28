import { verifyPackToken } from "@/lib/admission-pack-link";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildAdmissionPdf } from "@/lib/admission-pdf";
import { admissionDeadlineText } from "@/lib/admission-deadline";
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

/** Télécharge la lettre d'admission d'un pack, via un lien signé (sans compte). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t") || "";
  const link = await verifyPackToken(token);
  if (!link) return new Response("Lien invalide ou expiré.", { status: 404 });

  const admin = createAdminClient();
  if (!admin) return new Response("Service indisponible.", { status: 503 });

  const { data: pack } = await admin
    .from("admission_packs")
    .select("candidature_id, class_id, accepted_level, registration_fee, tuition_due, academic_year")
    .eq("id", link.packId)
    .single();
  if (!pack) return new Response("Pack introuvable.", { status: 404 });

  const { data: cand } = await admin
    .from("inscription_requests")
    .select("full_name, program_interest, admission_sent_at")
    .eq("id", pack.candidature_id)
    .single();

  // Formation + niveau RÉELLEMENT acceptés (classe du pack), pas le programme demandé.
  let acceptedProgram = (cand?.program_interest as string) ?? null;
  let acceptedLevel = (pack.accepted_level as string) ?? null;
  if (pack.class_id) {
    const { data: klass } = await admin
      .from("classes")
      .select("level, filiere_id")
      .eq("id", pack.class_id)
      .single();
    if (klass?.level) acceptedLevel = klass.level as string;
    if (klass?.filiere_id) {
      const { data: fil } = await admin
        .from("filieres")
        .select("name")
        .eq("id", klass.filiere_id)
        .single();
      if (fil?.name) acceptedProgram = fil.name as string;
    }
  }

  const pdf = await buildAdmissionPdf({
    name: (cand?.full_name as string) ?? "",
    program: acceptedProgram,
    level: acceptedLevel,
    academicYear: (pack.academic_year as string) ?? null,
    registrationFee: Number(pack.registration_fee ?? 0),
    tuitionDue: pack.tuition_due != null ? Number(pack.tuition_due) : null,
    testMode: TEST_MODE,
    deadlineText: admissionDeadlineText((cand?.admission_sent_at as string) ?? null),
  });

  const base = slugify(`${cand?.full_name ?? "admission"}`) || "admission";
  const filename = `${TEST_MODE ? "TEST-" : ""}lettre-admission-${base}.pdf`;

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      // inline → s'ouvre dans l'onglet (fiable sur iOS Safari), puis « Partager/Enregistrer ».
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
