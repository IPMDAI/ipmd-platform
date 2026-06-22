import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/espace/Sidebar";
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

  return (
    <div className="min-h-screen bg-ipmd-light lg:flex">
      <Sidebar
        groups={groups}
        roleLabel={roleLabels[role] ?? role}
        userName={userName}
      />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
