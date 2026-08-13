import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { PrintButton } from "@/components/espace/PrintButton";
import { DocumentLetter } from "@/components/espace/documents/DocumentLetter";
import { StudentCard } from "@/components/espace/documents/StudentCard";
import { DocOptionsBar } from "@/components/espace/documents/DocOptionsBar";
import { getDossier, isDocumentSlug, longDate } from "@/lib/documents";
import { parseCivilite } from "@/lib/doc-format";
import { signDoc, verifyUrl } from "@/lib/doc-verify";
import { resolveSignatory, SIGNATORIES } from "@/lib/signatories";
import { officialAssetDataUri } from "@/lib/secure-assets";
import { isDocReady } from "@/lib/doc-grants";

export const metadata: Metadata = {
  title: "Document officiel",
};

export default async function DocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{
    student?: string;
    signataire?: string;
    variante?: string;
    matricule?: string;
    civilite?: string;
    date?: string;
  }>;
}) {
  const { type } = await params;
  const { student, signataire, variante, matricule, civilite, date } =
    await searchParams;
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

  // Verrou : un non-admin (étudiant/parent) ne peut ouvrir un document que s'il
  // est ACTIVÉ par l'administration ET PRÊT (signature DU SIGNATAIRE RETENU + cachet).
  let grantSignatory: string | undefined;
  if (!isAdmin) {
    const { data: grant } = await supabase
      .from("document_grants")
      .select("active, signatory")
      .eq("student_id", targetId)
      .eq("doc_type", type)
      .maybeSingle();
    if (!grant?.active) notFound();
    grantSignatory = grant.signatory ?? undefined;
    const ready = await isDocReady(type, dossier.isBootcamp, grantSignatory);
    if (!ready) notFound();
  }

  // Variante « sous réserve » (attestation de réussite) + matricule affiché.
  const variant =
    type === "attestation-reussite" && variante === "sous-reserve"
      ? ("sous-reserve" as const)
      : ("definitive" as const);
  const effectiveMatricule = matricule?.trim() || dossier.matricule;
  const civ = parseCivilite(civilite);
  const dateLabel =
    date && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? longDate(new Date(date + "T12:00:00Z"))
      : undefined;

  const verifyHref = verifyUrl(
    signDoc({
      t: type,
      m: effectiveMatricule,
      n: dossier.name,
      y: dossier.year,
      ...(type === "attestation-reussite" && variant !== "sous-reserve"
        ? { a: dossier.average, me: dossier.mention }
        : {}),
      ...(variant === "sous-reserve" ? { v: "sous-reserve" } : {}),
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

  // Signataire : pour un non-admin, celui retenu à l'activation (grant) ;
  // pour l'admin, celui choisi via le sélecteur (?signataire=), sinon le titulaire.
  const effectiveSignataire = isAdmin ? signataire : grantSignatory;
  const sig = resolveSignatory(kind, dossier.isBootcamp, effectiveSignataire);
  // Image de signature lue côté serveur depuis le bucket privé (jamais d'URL publique).
  const signatureSrc = (await officialAssetDataUri(sig.signature)) ?? undefined;

  // Liens du sélecteur de signataire (conserve l'étudiant ciblé).
  const signatoryHref = (key: string) => {
    const qs = new URLSearchParams();
    if (student) qs.set("student", student);
    qs.set("signataire", key);
    if (variante === "sous-reserve") qs.set("variante", "sous-reserve");
    if (matricule) qs.set("matricule", matricule);
    if (civilite) qs.set("civilite", civilite);
    if (date) qs.set("date", date);
    return `?${qs.toString()}`;
  };

  // Lien de téléchargement du PDF officiel (génération serveur).
  const pdfHref = (() => {
    const qs = new URLSearchParams();
    if (student) qs.set("student", student);
    if (signataire) qs.set("signataire", signataire);
    if (variante === "sous-reserve") qs.set("variante", "sous-reserve");
    if (matricule) qs.set("matricule", matricule);
    if (civilite) qs.set("civilite", civilite);
    if (date) qs.set("date", date);
    const q = qs.toString();
    return `/espace/document/${type}/pdf${q ? `?${q}` : ""}`;
  })();

  // Liens du sélecteur de variante (conserve les autres paramètres).
  const variantHref = (v: string) => {
    const qs = new URLSearchParams();
    if (student) qs.set("student", student);
    if (signataire) qs.set("signataire", signataire);
    if (matricule) qs.set("matricule", matricule);
    if (civilite) qs.set("civilite", civilite);
    if (date) qs.set("date", date);
    if (v === "sous-reserve") qs.set("variante", "sous-reserve");
    const q = qs.toString();
    return q ? `?${q}` : "?";
  };

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

          {type === "attestation-reussite" && isAdmin && (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 text-xs shadow-sm ring-1 ring-black/5 print:hidden">
              <span className="font-semibold text-black/55">Type :</span>
              {[
                { v: "definitive", label: "Réussite définitive" },
                { v: "sous-reserve", label: "Sous réserve de soutenance" },
              ].map((opt) => {
                const active = variant === opt.v;
                return (
                  <Link
                    key={opt.v}
                    href={variantHref(opt.v)}
                    className={`rounded-full px-3 py-1 font-medium transition-colors ${
                      active
                        ? "bg-ipmd-red text-white"
                        : "bg-ipmd-light text-black/70 hover:bg-black/10"
                    }`}
                  >
                    {opt.label}
                  </Link>
                );
              })}
            </div>
          )}

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

          {type !== "carte" && isAdmin && (
            <DocOptionsBar
              civilite={civilite}
              matricule={matricule}
              date={date}
            />
          )}

          <div className="print-area mt-6">
            {type === "carte" ? (
              <StudentCard dossier={dossier} verifyHref={verifyHref} />
            ) : (
              <DocumentLetter
                dossier={dossier}
                verifyHref={verifyHref}
                kind={kind}
                variant={variant}
                matricule={effectiveMatricule}
                civilite={civ}
                dateLabel={dateLabel}
                signatory={{
                  title: sig.title,
                  name: sig.name,
                  mention: variant === "sous-reserve" ? null : sig.mention,
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
