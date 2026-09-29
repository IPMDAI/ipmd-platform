import fs from "node:fs";
import path from "node:path";
import { requireUser } from "@/lib/require-user";
import { longDate } from "@/lib/documents";
import { getReglementForUser } from "@/lib/reglement-user";
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

/** Téléchargement du règlement intérieur en PDF (variante selon le parcours). */
export async function GET() {
  const { userId } = await requireUser();
  const reglement = await getReglementForUser(userId);
  const isBootcamp = reglement.version.startsWith("bootcamp");

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
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
