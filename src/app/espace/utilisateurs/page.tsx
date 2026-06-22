import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { RoleManager } from "@/components/espace/RoleManager";
import { CreateUserForm } from "@/components/espace/CreateUserForm";

export const metadata: Metadata = {
  title: "Gestion des utilisateurs",
};

export default async function UtilisateursPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/connexion");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  // Réservé au Super Admin.
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (me?.role !== "super_admin") redirect("/espace");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .order("created_at", { ascending: true });

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/espace"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Gestion des utilisateurs
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Attribuez un rôle à chaque compte. Les changements sont immédiats.
          </p>

          <div className="mt-8">
            <CreateUserForm />
          </div>

          <div className="mt-8">
            <RoleManager
              initialUsers={profiles ?? []}
              currentUserId={user.id}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
