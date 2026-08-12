import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createJsClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseAnonKey } from "@/lib/supabase/config";

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

    // 2) S'assurer que la ligne profiles existe (l'INSERT n'est pas gardé par
    //    le trigger guard_profile_role ; seul l'UPDATE l'est).
    const { data: byId } = await admin
      .from("profiles")
      .select("id, role")
      .eq("id", authId)
      .maybeSingle();
    if (!byId) {
      const { error } = await admin.from("profiles").insert({
        id: authId,
        email: OWNER_EMAIL,
        full_name: authUser.user_metadata?.full_name ?? OWNER_EMAIL,
        role: "super_admin",
      });
      if (error) return new Response("Erreur insert : " + error.message, { status: 500 });
      return new Response(
        `✅ Profil créé pour ${OWNER_EMAIL} avec le rôle SUPER ADMIN.\n\n👉 Déconnecte-toi puis reconnecte-toi.`,
        { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }
    if (byId.role === "super_admin")
      return new Response(
        `✅ ${OWNER_EMAIL} est déjà SUPER ADMIN.\n\n👉 Déconnecte-toi puis reconnecte-toi.`,
        { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );

    // 3) Le trigger guard_profile_role annule tout changement de rôle si
    //    l'appelant n'est pas déjà super_admin. Le service-role ne l'est pas
    //    (auth.uid() = NULL). On agit donc AU NOM d'un super_admin existant :
    //    on génère un lien magique (aucun email envoyé) pour obtenir une
    //    session valide de ce super_admin, puis on fait l'UPDATE avec.
    const { data: admins } = await admin
      .from("profiles")
      .select("id, email, role")
      .eq("role", "super_admin");
    const actorProfile = (admins ?? []).find((a) => a.id !== authId);
    if (!actorProfile) {
      return new Response(
        `Aucun super_admin existant pour effectuer la promotion.\n` +
          `(Le trigger guard_profile_role bloque le service-role.)\n` +
          `Profils super_admin trouvés : ${(admins ?? []).length}.`,
        { status: 409 }
      );
    }
    const actorAuth = list.users.find((u) => u.id === actorProfile.id);
    const actorEmail = (actorAuth?.email || actorProfile.email || "").trim();
    if (!actorEmail)
      return new Response(
        `Le super_admin ${actorProfile.id} n'a pas d'email exploitable.`,
        { status: 409 }
      );

    // 3a) Lien magique interne (non envoyé) → token_hash.
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: actorEmail,
    });
    if (linkErr || !link.properties?.hashed_token)
      return new Response(
        "Erreur génération lien (" + actorEmail + ") : " + (linkErr?.message ?? "token absent"),
        { status: 500 }
      );

    // 3b) Vérifier l'OTP pour obtenir une session du super_admin.
    const anon = createJsClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: verified, error: vErr } = await anon.auth.verifyOtp({
      token_hash: link.properties.hashed_token,
      type: "magiclink",
    });
    if (vErr || !verified.session)
      return new Response(
        "Erreur verifyOtp : " + (vErr?.message ?? "session absente"),
        { status: 500 }
      );

    // 3c) Client authentifié EN TANT QUE super_admin → l'UPDATE passe le trigger.
    const asAdmin = createJsClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: { Authorization: `Bearer ${verified.session.access_token}` },
      },
    });
    const { error: upErr } = await asAdmin
      .from("profiles")
      .update({ role: "super_admin" })
      .eq("id", authId);
    if (upErr)
      return new Response(
        "Erreur update (au nom de " + actorEmail + ") : " + upErr.message,
        { status: 500 }
      );

    // 4) Relecture (service-role) pour confirmer que ça a bien tenu.
    const { data: after } = await admin
      .from("profiles")
      .select("role")
      .eq("id", authId)
      .maybeSingle();

    const ok = after?.role === "super_admin";
    return new Response(
      (ok ? "✅" : "⚠️") +
        ` Rôle de ${OWNER_EMAIL} : ${after?.role ?? "?"} ` +
        `(agi au nom de ${actorEmail}).\n\n` +
        (ok
          ? "👉 Déconnecte-toi puis reconnecte-toi sur ipmd.pro : le menu Candidatures apparaîtra."
          : "Le trigger a peut-être encore annulé — préviens l'assistant."),
      { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
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
