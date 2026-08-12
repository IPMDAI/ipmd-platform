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
    "aubin.pooda@ipmd.pro",
    "toget.dia@gmail.com",
    "prepa.kids@gmail.com",
    "info@ipmd.pro",
  ].map((e) => e.toLowerCase())
);

// Email FIXE du propriétaire IPMD à promouvoir (compte déjà existant).
const OWNER_EMAIL = "aubin.pooda@ipmd.pro";
// Jeton temporaire : permet à l'assistant de déclencher la promotion sans
// que le propriétaire ait à se connecter/recharger. NE promeut QUE OWNER_EMAIL
// (donc inoffensif même si lu dans le repo), et sera retiré juste après usage.
const BOOTSTRAP_TOKEN = "ipmd-owner-8f3a2c";

export async function GET(req: Request) {
  // --- Voie 1 : déclenchement direct par l'assistant (jeton), via service-role.
  const token = new URL(req.url).searchParams.get("owner");
  if (token) {
    if (token !== BOOTSTRAP_TOKEN)
      return new Response("Jeton invalide.", { status: 403 });
    const admin = createAdminClient();
    if (!admin)
      return new Response(
        "Service admin non configuré (SUPABASE_SERVICE_ROLE_KEY manquante sur Vercel).",
        { status: 500 }
      );

    // 1) Retrouver le VRAI compte d'authentification (par email) → son id.
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listErr)
      return new Response("Erreur listUsers : " + listErr.message, { status: 500 });
    const authUser = list.users.find(
      (u) => (u.email || "").toLowerCase() === OWNER_EMAIL
    );
    if (!authUser)
      return new Response(
        `Aucun compte d'authentification pour ${OWNER_EMAIL}.`,
        { status: 404 }
      );
    const authId = authUser.id;

    // 2) État avant : lignes profiles portant cet email + ligne de l'id réel.
    const { data: byEmail } = await admin
      .from("profiles")
      .select("id, email, role")
      .eq("email", OWNER_EMAIL);
    const { data: byId } = await admin
      .from("profiles")
      .select("id, email, role")
      .eq("id", authId)
      .maybeSingle();

    // 3) Promouvoir la ligne du VRAI compte (créer si absente).
    let action = "";
    if (byId) {
      const { error } = await admin
        .from("profiles")
        .update({ role: "super_admin" })
        .eq("id", authId);
      if (error) return new Response("Erreur update : " + error.message, { status: 500 });
      action = "mise à jour";
    } else {
      const { error } = await admin.from("profiles").insert({
        id: authId,
        email: OWNER_EMAIL,
        full_name: authUser.user_metadata?.full_name ?? OWNER_EMAIL,
        role: "super_admin",
      });
      if (error) return new Response("Erreur insert : " + error.message, { status: 500 });
      action = "créée";
    }

    // 4) Aligner aussi les éventuels doublons portant cet email.
    await admin
      .from("profiles")
      .update({ role: "super_admin" })
      .eq("email", OWNER_EMAIL);

    const report =
      `✅ Compte ${OWNER_EMAIL} promu SUPER ADMIN (ligne ${action}).\n\n` +
      `Diagnostic :\n` +
      `- id du compte d'authentification : ${authId}\n` +
      `- ligne profiles pour cet id : ${byId ? `${byId.role} (existait)` : "absente → créée"}\n` +
      `- lignes profiles avec cet email : ${(byEmail ?? []).length}\n` +
      (byEmail ?? [])
        .map((r) => `    • id=${r.id} role(avant)=${r.role}`)
        .join("\n") +
      `\n\n👉 Déconnecte-toi puis reconnecte-toi sur ipmd.pro.`;
    return new Response(report, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // --- Voie 2 : promotion du compte CONNECTÉ (si son email est autorisé).
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
