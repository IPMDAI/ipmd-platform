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
  // `directeur_etudes` peut enseigner, mais UNIQUEMENT sur ses cours réellement
  // affectés (RLS `owns_course` = courses.teacher_id = auth.uid()). Il n'est
  // jamais enseignant global : l'accès à la page ne lui donne aucune donnée
  // d'un cours qui ne lui est pas affecté.
  if (role !== "enseignant" && role !== "super_admin" && role !== "directeur_etudes")
    redirect("/espace");

  return { supabase, role, userId: user.id };
}
