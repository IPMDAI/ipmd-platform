import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { ActionButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DashboardTile } from "@/components/espace/DashboardTile";
import { DailyBriefing } from "@/components/espace/DailyBriefing";
import { LearnerOverview } from "@/components/espace/LearnerOverview";
import { NotificationsPanel } from "@/components/espace/NotificationsPanel";
import { AnnouncementsPanel } from "@/components/espace/AnnouncementsPanel";
import { ClassFeed } from "@/components/espace/ClassFeed";
import { TeacherOverview } from "@/components/espace/TeacherOverview";
import { TeacherTodo } from "@/components/espace/TeacherTodo";
import { signOut } from "@/lib/auth-actions";
import {
  findConflicts,
  CONFLICT_LABEL,
  type Conflict,
  type Slot,
} from "@/lib/planning-conflicts";
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
      supabase.from("inscription_requests").select("*", { count: "exact", head: true }).eq("status", "nouveau"),
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

  // Détection automatique des conflits de planning (admins).
  let conflicts: Conflict[] = [];
  if (isAdmin) {
    const [slotRows, classRows, roomRows, teacherRows] = await Promise.all([
      supabase
        .from("timetable_slots")
        .select("id, class_id, subject, teacher_id, room_id, day_of_week, start_time, end_time"),
      supabase.from("classes").select("id, name"),
      supabase.from("rooms").select("id, name"),
      supabase.from("profiles").select("id, full_name").eq("role", "enseignant"),
    ]);
    conflicts = findConflicts((slotRows.data ?? []) as Slot[], {
      classes: new Map((classRows.data ?? []).map((c) => [c.id, c.name])),
      rooms: new Map((roomRows.data ?? []).map((r) => [r.id, r.name])),
      teachers: new Map((teacherRows.data ?? []).map((t) => [t.id, t.full_name ?? "?"])),
    });
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

          {/* Annonces de l'administration (tous rôles) */}
          <AnnouncementsPanel role={role} userId={user.id} />

          {/* À traiter (admins) : ce qui attend une action, en tête */}
          {pending && (
            <div className="mt-8">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-black/40">
                À traiter
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { href: "/espace/candidatures", icon: "📥", label: "Nouvelles candidatures", value: pending.candidatures, alert: pending.candidatures > 0 },
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

          {/* Pilotage intelligent (admins) : conflits + synthèse IA */}
          {isAdmin && (
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🗓️</span>
                    <h3 className="font-bold text-ipmd-black">
                      Conflits de planning
                    </h3>
                  </div>
                  {conflicts.length > 0 && (
                    <span className="rounded-full bg-ipmd-red px-2 py-0.5 text-xs font-bold text-white">
                      {conflicts.length}
                    </span>
                  )}
                </div>
                {conflicts.length === 0 ? (
                  <p className="mt-3 text-sm font-medium text-green-700">
                    ✅ Aucun conflit détecté dans le planning.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {conflicts.slice(0, 6).map((c, i) => (
                      <li
                        key={i}
                        className="rounded-lg bg-ipmd-light px-3 py-2 text-sm"
                      >
                        <span className="font-semibold text-ipmd-red">
                          {CONFLICT_LABEL[c.kind]}
                        </span>
                        <span className="text-black/60"> · {c.detail}</span>
                      </li>
                    ))}
                    {conflicts.length > 6 && (
                      <li className="text-xs text-black/45">
                        + {conflicts.length - 6} autre(s)…
                      </li>
                    )}
                    <li>
                      <Link
                        href="/espace/planning"
                        className="text-xs font-semibold text-ipmd-red hover:underline"
                      >
                        Ouvrir le planning →
                      </Link>
                    </li>
                  </ul>
                )}
              </div>

              <DailyBriefing />
            </div>
          )}

          {/* Annonces de la classe (apprenants) */}
          {showTutor && <ClassFeed userId={user.id} />}

          {/* Notifications dérivées (apprenants) : ce qui est important */}
          {showTutor && <NotificationsPanel userId={user.id} />}

          {/* Cockpit de l'apprenant : ses cours du jour + ses résultats */}
          {showTutor && <LearnerOverview userId={user.id} />}

          {/* Cockpit de l'enseignant : à faire + ses cours du jour + volumes */}
          {role === "enseignant" && <TeacherTodo userId={user.id} />}
          {role === "enseignant" && <TeacherOverview userId={user.id} />}

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
        </div>
      </Container>
    </section>
  );
}
