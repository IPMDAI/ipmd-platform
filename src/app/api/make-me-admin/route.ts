import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Bootstrap unique de récupération admin.
// Ne promeut QUE l'utilisateur CONNECTÉ, et seulement si son email est dans
// la liste ci-dessous (emails du propriétaire IPMD). À retirer après usage.
const ALLOW = new Set(
  [
    "pooda.aubin@gmail.com",
    "aubin.pooda@hotmail.com",
    "toget.dia@gmail.com",
    "prepa.kids@gmail.com",
    "info@ipmd.pro",
  ].map((e) => e.toLowerCase())
);

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return new Response("Service indisponible.", { status: 500 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return new Response(
      "Connecte-toi d'abord sur ipmd.pro (dans CE navigateur), puis reviens sur cette page.",
      { status: 401 }
    );

  const email = (user.email || "").toLowerCase();
  if (!ALLOW.has(email))
    return new Response(
      `Compte non autorisé pour cette opération : ${email}\n(Donne cet email à ton assistant pour l'ajouter.)`,
      { status: 403 }
    );

  const admin = createAdminClient();
  if (!admin)
    return new Response(
      "Service admin non configuré (SUPABASE_SERVICE_ROLE_KEY manquante sur Vercel).",
      { status: 500 }
    );

  const { error } = await admin
    .from("profiles")
    .update({ role: "super_admin" })
    .eq("id", user.id);
  if (error) return new Response("Erreur : " + error.message, { status: 500 });

  return new Response(
    `✅ C'est fait ! Le compte ${email} est maintenant SUPER ADMIN.\n\n` +
      `👉 Déconnecte-toi de ipmd.pro, puis reconnecte-toi : tu verras le menu Admin (dont Candidatures).`,
    { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
}
