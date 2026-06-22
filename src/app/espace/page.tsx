import type { Metadata } from "next";
import Link from "next/link";
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
  dashboardSections,
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
  const sections = dashboardSections[role];
  const tiles = dashboardTiles[role] ?? dashboardTiles.etudiant;
  const showTutor = LEARNER_ROLES.has(role);
  const isAdmin = role === "admin" || role === "super_admin";

  // Panneau « à traiter » (admins) : compteurs rapides.
  let pending: {
    candidatures: number;
    messages: number;
    filieres: number;
    modules: number;
  } | null = null;
  if (isAdmin) {
    const [cand, msg, fil, mod] = await Promise.all([
      supabase.from("inscription_requests").select("*", { count: "exact", head: true }),
      supabase.from("contact_messages").select("*", { count: "exact", head: true }),
      supabase.from("filieres").select("*", { count: "exact", head: true }).eq("status", "en_attente"),
      supabase.from("modules").select("*", { count: "exact", head: true }).eq("status", "en_attente"),
    ]);
    pending = {
      candidatures: cand.count ?? 0,
      messages: msg.count ?? 0,
      filieres: fil.count ?? 0,
      modules: mod.count ?? 0,
    };
  }

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

          {/* À traiter (admins) : ce qui attend une action, en tête */}
          {pending && (
            <div className="mt-8">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-black/40">
                À traiter
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { href: "/espace/candidatures", icon: "📥", label: "Candidatures reçues", value: pending.candidatures, alert: false },
                  { href: "/espace/messages", icon: "✉️", label: "Messages de contact", value: pending.messages, alert: false },
                  { href: "/espace/classes", icon: "🏫", label: "Filières à valider", value: pending.filieres, alert: pending.filieres > 0 },
                  { href: "/espace/classes", icon: "📦", label: "Modules à valider", value: pending.modules, alert: pending.modules > 0 },
                ].map((c) => (
                  <Link
                    key={c.label}
                    href={c.href}
                    className={`rounded-2xl bg-white p-5 shadow-sm ring-1 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                      c.alert ? "ring-ipmd-red/40" : "ring-black/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{c.icon}</span>
                      <span
                        className={`text-2xl font-extrabold ${
                          c.alert ? "text-ipmd-red" : "text-ipmd-black"
                        }`}
                      >
                        {c.value}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-black/60">
                      {c.label}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tuiles du rôle — en sections pour les admins, à plat sinon */}
          {sections ? (
            <div className="mt-8 space-y-8">
              {sections.map((sec) => (
                <div key={sec.title}>
                  <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-black/40">
                    {sec.title}
                  </h2>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {sec.tiles.map((tile) => (
                      <DashboardTile key={tile.title} tile={tile} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tiles.map((tile) => (
                <DashboardTile key={tile.title} tile={tile} />
              ))}
            </div>
          )}

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
