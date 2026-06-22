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

export const metadata: Metadata = {
  title: "Document officiel",
};

export default async function DocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ student?: string }>;
}) {
  const { type } = await params;
  const { student } = await searchParams;
  if (!isDocumentSlug(type)) notFound();

  const { userId } = await requireUser();
  const targetId = student || userId;

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

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between gap-3 print:hidden">
            <Link
              href={backHref}
              className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
            >
              ← Mes documents
            </Link>
            <PrintButton />
          </div>

          <div className="mt-6">
            {type === "carte" ? (
              <StudentCard dossier={dossier} verifyHref={verifyHref} />
            ) : (
              <DocumentLetter
                dossier={dossier}
                verifyHref={verifyHref}
                kind={
                  type === "certificat-scolarite"
                    ? "certificat"
                    : type === "attestation-reussite"
                    ? "reussite"
                    : "scolarite"
                }
              />
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
