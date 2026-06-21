import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { ActionButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { signOut } from "@/lib/auth-actions";

export const metadata: Metadata = {
  title: "Mon espace",
};

/** Libellés lisibles des rôles. */
const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administration",
  enseignant: "Enseignant",
  etudiant: "Étudiant",
  parent: "Parent",
  professionnel: "Professionnel",
  dirigeant: "Dirigeant",
};

export default async function EspacePage() {
  const supabase = await createClient();

  // Sans Supabase configuré, on renvoie vers la connexion.
  if (!supabase) redirect("/connexion");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .single();

  const fullName =
    profile?.full_name || (user.user_metadata?.full_name as string) || "—";
  const role = profile?.role ?? "etudiant";

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          {/* En-tête */}
          <div className="flex flex-col gap-4 rounded-3xl bg-ipmd-black p-8 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge tone="red">{roleLabels[role] ?? role}</Badge>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight">
                Bonjour, {fullName} 👋
              </h1>
              <p className="mt-1 text-sm text-white/60">
                {profile?.email ?? user.email}
              </p>
            </div>
            <form action={signOut}>
              <ActionButton
                type="submit"
                variant="outline"
                className="border-white/30 text-white hover:bg-white hover:text-ipmd-black"
              >
                Se déconnecter
              </ActionButton>
            </form>
          </div>

          {/* Contenu (à enrichir selon le rôle) */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <h2 className="text-lg font-bold text-ipmd-black">Mon profil</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-black/40">Nom</dt>
                  <dd className="font-semibold text-ipmd-black">{fullName}</dd>
                </div>
                <div>
                  <dt className="text-black/40">Email</dt>
                  <dd className="font-semibold text-ipmd-black">
                    {profile?.email ?? user.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-black/40">Rôle</dt>
                  <dd className="font-semibold text-ipmd-black">
                    {roleLabels[role] ?? role}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <h2 className="text-lg font-bold text-ipmd-black">
                🤖 Tuteur IA
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-black/60">
                Bientôt : votre tuteur IA personnalisé, adapté à votre profil et
                à votre parcours, vous accompagnera ici au quotidien.
              </p>
              <span className="mt-4 inline-block rounded-full bg-ipmd-light px-3 py-1 text-xs font-semibold text-black/50">
                En préparation
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
