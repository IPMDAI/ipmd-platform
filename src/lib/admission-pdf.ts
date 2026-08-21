import "server-only";
import fs from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import { signDoc, verifyUrl } from "@/lib/doc-verify";
import { officialAssetDataUri } from "@/lib/secure-assets";
import { SIGNATORY } from "@/lib/admission-letter";
import {
  renderAdmissionLetterPdf,
} from "@/components/espace/documents/AdmissionLetterPdf";

/** Logo IPMD (public) en data URI (runtime Node). */
function logoDataUri(): string {
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), "public", "logo-ipmd.png"));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

export type AdmissionPdfInput = {
  name: string;
  program: string | null;
  level: string | null;
  academicYear: string | null;
  registrationFee: number;
  tuitionDue: number | null;
  testMode: boolean;
};

/**
 * Construit le PDF signé de la lettre d'admission (QR de vérification +
 * signature + cachet lus dans le bucket privé). Source unique, réutilisée par
 * l'email d'admission (C1) et le téléchargement dans l'espace sécurisé (C2).
 */
export async function buildAdmissionPdf(d: AdmissionPdfInput): Promise<Buffer> {
  const longDate = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const verifyHref = verifyUrl(
    signDoc({ t: "admission", m: "", n: d.name, y: d.academicYear ?? "" })
  );
  const [qrSrc, signatureSrc, cachetSrc] = await Promise.all([
    QRCode.toDataURL(verifyHref, { margin: 0, errorCorrectionLevel: "M", width: 220 }),
    officialAssetDataUri("signatures/admin-general.png"),
    officialAssetDataUri("stamps/cachet-ipmd.png"),
  ]);
  return renderAdmissionLetterPdf({
    name: d.name,
    program: d.program,
    level: d.level,
    academicYear: d.academicYear,
    registrationFee: d.registrationFee,
    tuitionDue: d.tuitionDue,
    longDate,
    logoSrc: logoDataUri(),
    signatoryTitle: SIGNATORY.title,
    signatoryName: SIGNATORY.name,
    testMode: d.testMode,
    qrSrc,
    signatureSrc: signatureSrc ?? undefined,
    cachetSrc: cachetSrc ?? undefined,
  });
}
