import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { DossierUploadForm } from "@/components/forms/DossierUploadForm";
import { verifyDossierToken } from "@/lib/dossier-link";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Compléter mon dossier",
  robots: { index: false, follow: false },
};

export default async function CompleterDossierPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const candidatureId = t ? verifyDossierToken(t) : null;

  const shell = (children: React.ReactNode) => (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-lg">{children}</div>
      </Container>
    </section>
  );

  const errorBox = (msg: string) =>
    shell(
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
        <p className="text-3xl">🔒</p>
        <h1 className="mt-3 text-xl font-extrabold text-ipmd-black">
          Lien invalide
        </h1>
        <p className="mt-2 text-sm text-black/60">{msg}</p>
      </div>
    );

  if (!candidatureId) {
    return errorBox(
      "Ce lien est invalide ou expiré. Merci de demander un nouveau lien à l'IPMD (info@ipmd.pro)."
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return errorBox("Service momentanément indisponible. Merci de réessayer plus tard.");
  }

  const { data: cand } = await admin
    .from("inscription_requests")
    .select("full_name, program_interest, doc_diploma, doc_id")
    .eq("id", candidatureId)
    .maybeSingle();

  if (!cand) {
    return errorBox("Candidature introuvable. Merci de contacter l'IPMD.");
  }

  const needsDiploma = !cand.doc_diploma;
  const needsId = !cand.doc_id;

  // Dossier déjà complet → rien à faire.
  if (!needsDiploma && !needsId) {
    return shell(
      <div className="rounded-2xl bg-green-50 p-8 text-center ring-1 ring-green-200">
        <p className="text-3xl">✅</p>
        <h1 className="mt-3 text-xl font-extrabold text-green-800">
          Dossier déjà complet
        </h1>
        <p className="mt-2 text-sm text-green-700">
          Vos pièces ont bien été reçues. Notre équipe reviendra vers vous. Merci !
        </p>
      </div>
    );
  }

  const prenom = (cand.full_name || "").split(" ")[0] || "";

  return shell(
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
      <span className="inline-block rounded-full bg-ipmd-red px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
        Admission
      </span>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
        Compléter mon dossier
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-black/60">
        {prenom ? `Bonjour ${prenom}, ` : ""}pour finaliser l&apos;étude de votre
        demande{cand.program_interest ? ` en ${cand.program_interest}` : ""}, merci
        de joindre les pièces manquantes ci-dessous. C&apos;est rapide et sécurisé.
      </p>

      <div className="mt-6">
        <DossierUploadForm
          token={t as string}
          needsDiploma={needsDiploma}
          needsId={needsId}
        />
      </div>
    </div>
  );
}
