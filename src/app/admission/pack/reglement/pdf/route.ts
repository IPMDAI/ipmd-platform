import fs from "node:fs";
import path from "node:path";
import { verifyPackToken } from "@/lib/admission-pack-link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getReglement, isBootcampUniverse } from "@/data/reglement";
import { renderReglementPdf } from "@/components/espace/documents/ReglementPdf";

export const runtime = "nodejs";

/** Logo IPMD (public) en data URI pour l'incruster dans le PDF. */
function logoDataUri(): string {
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), "public", "logo-ipmd.png"));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

function longDate(): string {
  return new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

/**
 * Téléchargement du règlement intérieur depuis le PACK d'admission, via un lien
 * signé (AVANT création de compte). La variante (bootcamp/diplôme) est résolue par
 * le PARCOURS de la candidature (univers), comme le consentement du pack.
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
    .select("candidature_id")
    .eq("id", link.packId)
    .single();
  if (!pack) return new Response("Pack introuvable.", { status: 404 });

  let universe: string | null = null;
  if (pack.candidature_id) {
    const { data: cand } = await admin
      .from("inscription_requests")
      .select("universe")
      .eq("id", pack.candidature_id as string)
      .maybeSingle();
    universe = (cand?.universe as string | null) ?? null;
  }
  const isBootcamp = isBootcampUniverse(universe);
  const reglement = getReglement(isBootcamp);

  const pdf = await renderReglementPdf({
    title: reglement.title,
    subtitle: isBootcamp ? "Bootcamps & Certificats" : "Cursus Diplôme (Licence & Master)",
    year: reglement.year,
    articles: reglement.articles,
    logoSrc: logoDataUri(),
    longDate: longDate(),
  });

  const filename = `reglement-interieur-${isBootcamp ? "bootcamp" : "diplome"}-${reglement.year}.pdf`;

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      // inline → s'ouvre dans l'onglet (fiable iOS Safari), puis « Partager/Enregistrer ».
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
