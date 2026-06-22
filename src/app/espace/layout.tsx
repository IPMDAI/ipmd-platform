import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/espace/Sidebar";
import { CommandPalette } from "@/components/espace/CommandPalette";
import { getNavForRole } from "@/lib/nav";
import { roleLabels } from "@/lib/dashboards";

export default async function EspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Non connecté : les pages gèrent la redirection ; pas de chrome d'app.
  if (!supabase) return <>{children}</>;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <>{children}</>;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "etudiant";
  const userName = profile?.full_name || profile?.email || "Mon compte";
  const groups = getNavForRole(role);

  // Badges de compteur sur le menu (admins).
  let badges: Record<string, { count: number; alert: boolean }> = {};
  if (role === "admin" || role === "super_admin") {
    const [cand, msg, fil, mod] = await Promise.all([
      supabase.from("inscription_requests").select("*", { count: "exact", head: true }),
      supabase.from("contact_messages").select("*", { count: "exact", head: true }),
      supabase.from("filieres").select("*", { count: "exact", head: true }).eq("status", "en_attente"),
      supabase.from("modules").select("*", { count: "exact", head: true }).eq("status", "en_attente"),
    ]);
    const toValidate = (fil.count ?? 0) + (mod.count ?? 0);
    badges = {
      "/espace/candidatures": { count: cand.count ?? 0, alert: false },
      "/espace/messages": { count: msg.count ?? 0, alert: false },
      "/espace/classes": { count: toValidate, alert: toValidate > 0 },
    };
  }

  const flatItems = groups.flatMap((g) =>
    g.items.map((it) => ({ ...it, group: g.title }))
  );

  return (
    <div className="min-h-screen bg-ipmd-light lg:flex">
      <Sidebar
        groups={groups}
        badges={badges}
        roleLabel={roleLabels[role] ?? role}
        userName={userName}
      />
      <main className="min-w-0 flex-1">{children}</main>
      <CommandPalette items={flatItems} />
    </div>
  );
}
