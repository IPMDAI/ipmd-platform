import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Garantit que l'utilisateur connecté est `admin` ou `super_admin`.
 * Redirige sinon. À utiliser en tête des pages d'administration.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  if (!supabase) redirect("/connexion");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = me?.role;
  if (role !== "super_admin" && role !== "admin") redirect("/espace");

  return { supabase, role, userId: user.id };
}
