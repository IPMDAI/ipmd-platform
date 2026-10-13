import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { verifySecureLink, type SecureLinkKind } from "@/lib/secure-link";

export const metadata: Metadata = { title: "Accès sécurisé" };

/** Destination côté ÉTUDIANT selon la nature de l'information. */
function studentTarget(kind: SecureLinkKind): string {
  if (kind === "note") return "/espace/mes-notes";
  if (kind === "absence") return "/espace/mon-emploi-du-temps";
  if (kind === "document" || kind === "convocation") return "/espace/mes-demarches";
  if (kind === "finance") return "/espace/mes-paiements";
  return "/espace";
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-black/5">
          <h1 className="text-xl font-extrabold text-ipmd-black">{title}</h1>
          <p className="mt-2 text-sm text-black/60">{body}</p>
          <Link
            href="/espace"
            className="mt-6 inline-flex rounded-full bg-ipmd-black px-5 py-2.5 text-sm font-semibold text-white"
          >
            Aller à mon espace
          </Link>
        </div>
      </Container>
    </section>
  );
}

export default async function AccesPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const payload = t ? verifySecureLink(t) : null;
  if (!payload) {
    return (
      <Message
        title="Lien expiré ou invalide"
        body="Ce lien d'accès n'est plus valide. Connectez-vous à votre espace pour consulter l'information."
      />
    );
  }

  const supabase = await createClient();
  if (!supabase) redirect("/connexion");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  // Contrôle d'accès via RLS : le profil de l'élève n'est lisible que par
  // l'élève lui-même, son parent lié, ou un admin.
  const { data: student } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", payload.s)
    .maybeSingle();
  if (!student) {
    return (
      <Message
        title="Accès non autorisé"
        body="Ce lien ne correspond pas à votre compte. Connectez-vous avec le compte concerné."
      />
    );
  }

  // L'étudiant lui-même → sa propre vue ; parent/admin → la fiche de l'enfant.
  if (user.id === payload.s) redirect(studentTarget(payload.k));
  redirect(`/espace/mon-enfant/${payload.s}`);
}
