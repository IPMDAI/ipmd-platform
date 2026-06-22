import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Garantit que l'utilisateur est `enseignant` (ou `super_admin`, qui peut
 * tout faire). Redirige sinon. À utiliser en tête des pages enseignant.
 */
export async function requireTeacher() {
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
  if (role !== "enseignant" && role !== "super_admin") redirect("/espace");

  return { supabase, role, userId: user.id };
}
