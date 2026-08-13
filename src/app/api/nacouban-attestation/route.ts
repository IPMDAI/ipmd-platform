import QRCode from "qrcode";
import fs from "node:fs";
import path from "node:path";
import { signDoc, verifyUrl } from "@/lib/doc-verify";
import { officialAssetDataUri } from "@/lib/secure-assets";
import {
  renderAttestationPdf,
  type AttestationPdfData,
} from "@/components/espace/documents/AttestationPdf";

export const runtime = "nodejs";

// Génération one-shot de l'attestation L3 « sous réserve » de NACOUBAN,
// avec tous les réglages (civilité, matricule officiel, date, Admin Général).
// Route temporaire (jeton) — à retirer après usage.
const TOKEN = "ipmd-nac-9x7k2";

function logoDataUri(): string {
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), "public", "logo-ipmd.png"));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("t");
  if (token !== TOKEN) return new Response("Jeton invalide.", { status: 403 });

  const name = "Nacouban Coulibaly Marie Rose Adèle";
  const matricule = "23-24IPMD008";
  const year = "2025 – 2026";

  const verifyHref = verifyUrl(
    signDoc({ t: "attestation-reussite", m: matricule, n: name, y: year, v: "sous-reserve" })
  );

  const [signatureSrc, cachetSrc, qrSrc] = await Promise.all([
    officialAssetDataUri("signatures/admin-general.png"),
    officialAssetDataUri("stamps/cachet-ipmd.png"),
    QRCode.toDataURL(verifyHref, { margin: 0, errorCorrectionLevel: "M", width: 220 }),
  ]);

  const data: AttestationPdfData = {
    kind: "reussite",
    variant: "sous-reserve",
    civilite: { label: "Mademoiselle", fem: true },
    isBootcamp: false,
    title: "Attestation de réussite",
    name,
    matricule,
    reference: "IPMD-CD4081E1",
    year,
    programLine: "Licence 3 — Marketing digital",
    birthLine: "Née le : 17/06/2003 au Plateau (Côte d'Ivoire)",
    average: null,
    mention: "",
    longDate: "13 août 2026",
    signatory: { title: "L'Administrateur Général", name: "POODA ETTIEN AUBIN", mention: null },
    logoSrc: logoDataUri(),
    qrSrc,
    signatureSrc: signatureSrc ?? undefined,
    cachetSrc: cachetSrc ?? undefined,
  };

  const pdf = await renderAttestationPdf(data);
  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="attestation-L3-nacouban.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
