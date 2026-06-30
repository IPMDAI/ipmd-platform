import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { PrintButton } from "@/components/espace/PrintButton";
import { DocumentLetter } from "@/components/espace/documents/DocumentLetter";
import { StudentCard } from "@/components/espace/documents/StudentCard";
import { getDossier, isDocumentSlug } from "@/lib/documents";
import { signDoc, verifyUrl } from "@/lib/doc-verify";
import { resolveSignatory, SIGNATORIES } from "@/lib/signatories";
import { officialAssetDataUri } from "@/lib/secure-assets";

export const metadata: Metadata = {
  title: "Document officiel",
};

export default async function DocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ student?: string; signataire?: string }>;
}) {
  const { type } = await params;
  const { student, signataire } = await searchParams;
  if (!isDocumentSlug(type)) notFound();

  const { supabase, userId } = await requireUser();
  const targetId = student || userId;

  // Le sélecteur de signataire (délégation) est réservé aux admins.
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  const isAdmin = me?.role === "admin" || me?.role === "super_admin";

  const dossier = await getDossier(targetId);
  if (!dossier) notFound();

  const verifyHref = verifyUrl(
    signDoc({
      t: type,
      m: dossier.matricule,
      n: dossier.name,
      y: dossier.year,
      ...(type === "attestation-reussite"
        ? { a: dossier.average, me: dossier.mention }
        : {}),
    })
  );

  const backHref = student
    ? `/espace/documents?student=${student}`
    : "/espace/documents";

  const kind =
    type === "certificat-scolarite"
      ? ("certificat" as const)
      : type === "attestation-reussite"
      ? ("reussite" as const)
      : ("scolarite" as const);

  // Signataire : défaut selon le type, ou délégué via ?signataire=.
  const sig = resolveSignatory(kind, dossier.isBootcamp, signataire);
  // Image de signature lue côté serveur depuis le bucket privé (jamais d'URL publique).
  const signatureSrc = (await officialAssetDataUri(sig.signature)) ?? undefined;

  // Liens du sélecteur de signataire (conserve l'étudiant ciblé).
  const signatoryHref = (key: string) => {
    const qs = new URLSearchParams();
    if (student) qs.set("student", student);
    qs.set("signataire", key);
    return `?${qs.toString()}`;
  };

  // Lien de téléchargement du PDF officiel (génération serveur).
  const pdfHref = (() => {
    const qs = new URLSearchParams();
    if (student) qs.set("student", student);
    if (signataire) qs.set("signataire", signataire);
    const q = qs.toString();
    return `/espace/document/${type}/pdf${q ? `?${q}` : ""}`;
  })();

  return (
    <section className="min-h-[70vh] bg-ipmd-light print:min-h-0">
      <Container className="py-12 sm:py-16 print:py-0">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between gap-3 print:hidden">
            <Link
              href={backHref}
              className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
            >
              ← Mes documents
            </Link>
            <div className="flex items-center gap-2">
              {type !== "carte" && (
                <a
                  href={pdfHref}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ipmd-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  ⬇ Télécharger PDF officiel
                </a>
              )}
              <PrintButton />
            </div>
          </div>

          <p className="mt-2 text-right text-xs text-black/45 print:hidden">
            {type === "carte" ? (
              <>
                💡 À l&apos;impression, le navigateur peut ajouter la date,
                l&apos;URL et le numéro de page — pour les retirer, décochez
                « En-têtes et pieds de page » dans « Plus de paramètres ».
              </>
            ) : (
              <>
                💡 Pour un document officiel parfaitement propre, utilisez{" "}
                <strong>« Télécharger PDF officiel »</strong> (aucun ajout du
                navigateur). L&apos;impression directe peut ajouter la date,
                l&apos;URL et le numéro de page — pour les retirer, décochez
                « En-têtes et pieds de page » dans « Plus de paramètres ».
              </>
            )}
          </p>

          {type !== "carte" && isAdmin && sig.allowed.length > 1 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 text-xs shadow-sm ring-1 ring-black/5 print:hidden">
              <span className="font-semibold text-black/55">Signataire :</span>
              {sig.allowed.map((key) => {
                const active = key === sig.key;
                return (
                  <Link
                    key={key}
                    href={signatoryHref(key)}
                    className={`rounded-full px-3 py-1 font-medium transition-colors ${
                      active
                        ? "bg-ipmd-red text-white"
                        : "bg-ipmd-light text-black/70 hover:bg-black/10"
                    }`}
                  >
                    {SIGNATORIES[key].title}
                  </Link>
                );
              })}
            </div>
          )}

          <div className="print-area mt-6">
            {type === "carte" ? (
              <StudentCard dossier={dossier} verifyHref={verifyHref} />
            ) : (
              <DocumentLetter
                dossier={dossier}
                verifyHref={verifyHref}
                kind={kind}
                signatory={{
                  title: sig.title,
                  name: sig.name,
                  mention: sig.mention,
                  signature: signatureSrc,
                }}
              />
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
