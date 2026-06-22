import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { ActionButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TuteurChat } from "@/components/espace/TuteurChat";
import { DashboardTile } from "@/components/espace/DashboardTile";
import { signOut } from "@/lib/auth-actions";
import {
  dashboardTiles,
  roleLabels,
  roleTagline,
  LEARNER_ROLES,
} from "@/lib/dashboards";

export const metadata: Metadata = {
  title: "Mon espace",
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
  const tiles = dashboardTiles[role] ?? dashboardTiles.etudiant;
  const showTutor = LEARNER_ROLES.has(role);

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          {/* En-tête */}
          <div className="flex flex-col gap-4 rounded-3xl bg-ipmd-black p-8 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge tone="red">{roleLabels[role] ?? role}</Badge>
              <h1 className="mt-3 text-2xl font-extrabold tracking-tight">
                Bonjour, {fullName} 👋
              </h1>
              <p className="mt-1 text-sm text-white/60">
                {roleTagline[role] ?? profile?.email ?? user.email}
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

          {/* Tuiles du rôle */}
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tiles.map((tile) => (
              <DashboardTile key={tile.title} tile={tile} />
            ))}
          </div>

          {/* Tuteur IA (rôles apprenants) */}
          {showTutor && (
            <div className="mt-8">
              <TuteurChat firstName={fullName.split(" ")[0]} />
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
