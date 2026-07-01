import "server-only";
import { officialAssetDataUri } from "@/lib/secure-assets";
import { resolveSignatory } from "@/lib/signatories";

/** Types de documents pouvant être activés par l'administration. */
export const DOC_GRANT_TYPES = [
  "attestation-scolarite",
  "certificat-scolarite",
  "attestation-reussite",
  "carte",
] as const;

function kindOf(slug: string): "scolarite" | "certificat" | "reussite" {
  return slug === "certificat-scolarite"
    ? "certificat"
    : slug === "attestation-reussite"
    ? "reussite"
    : "scolarite";
}

/**
 * Le document est-il « prêt » à être délivré ?
 * → cachet déposé ET signature du signataire déposée.
 * La carte étudiant n'exige ni signature ni cachet (elle a son propre QR).
 */
export async function isDocReady(slug: string, isBootcamp: boolean): Promise<boolean> {
  if (slug === "carte") return true;
  const cachet = await officialAssetDataUri("stamps/cachet-ipmd.png");
  if (!cachet) return false;
  const sig = resolveSignatory(kindOf(slug), isBootcamp);
  const signature = await officialAssetDataUri(sig.signature);
  return !!signature;
}
