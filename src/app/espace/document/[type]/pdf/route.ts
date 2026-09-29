import fs from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import { requireUser } from "@/lib/require-user";
import { getDossier, isDocumentSlug, longDate } from "@/lib/documents";
import {
  programLine,
  birthLine,
  documentTitle,
  parseCivilite,
  type DocKind,
} from "@/lib/doc-format";
import { resolveSignatory } from "@/lib/signatories";
import { officialAssetDataUri } from "@/lib/secure-assets";
import { signDoc, verifyUrl } from "@/lib/doc-verify";
import {
  renderAttestationPdf,
  type AttestationPdfData,
} from "@/components/espace/documents/AttestationPdf";

export const runtime = "nodejs";

/** Logo IPMD (public) lu en data URI pour l'incruster dans le PDF. */
function logoDataUri(): string {
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), "public", "logo-ipmd.png"));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .toLowerCase();
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params;
  // PDF officiel uniquement pour les courriers (pas la carte étudiant).
  if (!isDocumentSlug(type) || type === "carte") {
    return new Response("Document non disponible en PDF.", { status: 404 });
  }

  const { userId } = await requireUser();
  const url = new URL(req.url);
  const student = url.searchParams.get("student") || undefined;
  const signataire = url.searchParams.get("signataire") || undefined;
  const variante = url.searchParams.get("variante") || undefined;
  const matriculeOverride = url.searchParams.get("matricule")?.trim() || undefined;
  const civilite = parseCivilite(url.searchParams.get("civilite"));
  const dateParam = url.searchParams.get("date")?.trim() || undefined;
  // Réussite : libellé d'admission + clause soutenance CONFIRMÉS par l'admin.
  const admissionParam = url.searchParams.get("admission")?.trim() || undefined;
  const soutenanceParam = url.searchParams.get("soutenance");
  const soutenance =
    soutenanceParam === "1" || soutenanceParam === "true"
      ? true
      : soutenanceParam === "0" || soutenanceParam === "false"
      ? false
      : undefined;
  // Année académique confirmée par l'admin (ex. réussite « 2025-2026 »). À défaut,
  // année courante du dossier (comportement inchangé pour les autres documents).
  const anneeParam = url.searchParams.get("annee")?.trim() || undefined;
  const targetId = student || userId;

  const dossier = await getDossier(targetId);
  if (!dossier) return new Response("Dossier introuvable.", { status: 404 });
  const effectiveYear = anneeParam ? anneeParam.replace(/\s*-\s*/, " – ") : dossier.year;

  // Variante « sous réserve » (attestation de réussite) + matricule affiché.
  const variant =
    type === "attestation-reussite" && variante === "sous-reserve"
      ? ("sous-reserve" as const)
      : ("definitive" as const);
  const effectiveMatricule = matriculeOverride || dossier.matricule;
  const docDate =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? longDate(new Date(dateParam + "T12:00:00Z"))
      : longDate();

  const kind: DocKind =
    type === "certificat-scolarite"
      ? "certificat"
      : type === "attestation-reussite"
      ? "reussite"
      : "scolarite";

  const verifyHref = verifyUrl(
    signDoc({
      t: type,
      m: effectiveMatricule,
      n: dossier.name,
      y: effectiveYear,
      ...(type === "attestation-reussite" && variant !== "sous-reserve"
        ? { a: dossier.average, me: dossier.mention }
        : {}),
      ...(variant === "sous-reserve" ? { v: "sous-reserve" } : {}),
    })
  );

  const sig = resolveSignatory(kind, dossier.isBootcamp, signataire);

  const [signatureSrc, cachetSrc, qrSrc] = await Promise.all([
    officialAssetDataUri(sig.signature),
    officialAssetDataUri("stamps/cachet-ipmd.png"),
    QRCode.toDataURL(verifyHref, { margin: 0, errorCorrectionLevel: "M", width: 220 }),
  ]);

  const data: AttestationPdfData = {
    kind,
    variant,
    civilite,
    isBootcamp: dossier.isBootcamp,
    title: documentTitle(kind, dossier.isBootcamp),
    name: dossier.name,
    matricule: effectiveMatricule,
    reference: dossier.matricule,
    year: effectiveYear,
    programLine: programLine(dossier),
    birthLine: birthLine(dossier, civilite?.fem ?? null),
    average: dossier.average,
    mention: dossier.mention,
    longDate: docDate,
    admission: admissionParam ?? null,
    soutenance,
    signatory: {
      title: sig.title,
      name: sig.name,
      // Attestation de réussite : pas de mention de suppléance/délégation
      // (le signataire choisi signe directement, conforme au modèle officiel).
      mention: kind === "reussite" || variant === "sous-reserve" ? null : sig.mention,
    },
    logoSrc: logoDataUri(),
    qrSrc,
    signatureSrc: signatureSrc ?? undefined,
    cachetSrc: cachetSrc ?? undefined,
  };

  const pdf = await renderAttestationPdf(data);
  const filename = `${slugify(data.title)}-${slugify(dossier.name)}.pdf`;

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
