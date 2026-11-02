import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { DossierUploadForm, type DossierDocField } from "@/components/forms/DossierUploadForm";
import { DossierConversation } from "@/components/forms/DossierConversation";
import { verifyDossierToken } from "@/lib/dossier-link";
import { loadCandidateThread } from "@/lib/dossier-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { DOC_BY_KEY, isDocKey, type DocKey } from "@/lib/candidate-docs";

export const metadata: Metadata = {
  title: "Compléter mon dossier",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CompleterDossierPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const payload = t ? verifyDossierToken(t) : null;

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
        <h1 className="mt-3 text-xl font-extrabold text-ipmd-black">Lien invalide</h1>
        <p className="mt-2 text-sm text-black/60">{msg}</p>
      </div>
    );

  if (!payload) {
    return errorBox(
      "Ce lien est invalide ou a expiré. Merci de demander un nouveau lien à l'IPMD (info@ipmd.pro)."
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return errorBox("Service momentanément indisponible. Merci de réessayer plus tard.");
  }

  const { data: cand } = await admin
    .from("inscription_requests")
    .select(
      "full_name, program_interest, doc_diploma, doc_id, doc_cv, doc_bulletins, doc_attestation, requested_docs, dossier_token_version"
    )
    .eq("id", payload.candidatureId)
    .maybeSingle();

  if (!cand) {
    return errorBox("Candidature introuvable. Merci de contacter l'IPMD.");
  }
  // RÉVOCATION : la version du jeton doit correspondre à la version courante.
  if (Number(cand.dossier_token_version ?? 1) !== payload.version) {
    return errorBox(
      "Ce lien a été remplacé par un lien plus récent. Merci d'utiliser le dernier lien reçu de l'IPMD."
    );
  }

  const providedOf = (k: DocKey) => !!(cand as Record<string, unknown>)[DOC_BY_KEY[k].col];

  // Pièces à afficher : celles DEMANDÉES par l'équipe ; à défaut, les manquantes (diplôme/pièce d'identité).
  const requested = ((cand.requested_docs as string[] | null) ?? []).filter(isDocKey);
  const keys: DocKey[] =
    requested.length > 0
      ? requested
      : ([!cand.doc_diploma ? "diploma" : null, !cand.doc_id ? "id" : null].filter(
          Boolean
        ) as DocKey[]);

  const docFields: DossierDocField[] = keys.map((k) => {
    const provided = providedOf(k);
    return { key: k, label: DOC_BY_KEY[k].label, required: !provided, provided };
  });

  const thread = await loadCandidateThread(t as string);
  const messages = thread.ok ? thread.messages : [];

  const prenom = (cand.full_name || "").split(" ")[0] || "";

  return shell(
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
        <span className="inline-block rounded-full bg-ipmd-red px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
          Admission
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
          {docFields.length > 0 ? "Compléter mon dossier" : "Mon espace d'admission"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-black/60">
          {prenom ? `Bonjour ${prenom}, ` : ""}
          {docFields.length > 0
            ? `pour finaliser l'étude de votre demande${
                cand.program_interest ? ` en ${cand.program_interest}` : ""
              }, merci de joindre les pièces ci-dessous. C'est rapide et sécurisé.`
            : "retrouvez ici vos échanges avec l'équipe Admissions de l'IPMD."}
        </p>

        {docFields.length > 0 && (
          <div className="mt-6">
            <DossierUploadForm token={t as string} docs={docFields} />
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
        <DossierConversation token={t as string} initial={messages} />
      </div>
    </div>
  );
}
