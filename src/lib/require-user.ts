import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Garantit qu'un utilisateur est connecté. Redirige sinon. */
export async function requireUser() {
  const supabase = await createClient();
  if (!supabase) redirect("/connexion");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  return { supabase, userId: user.id };
}
