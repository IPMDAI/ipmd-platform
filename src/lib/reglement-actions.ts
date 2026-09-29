"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveUserIsBootcamp } from "@/lib/reglement-user";
import { getReglement } from "@/data/reglement";
import type { FormResult } from "@/types";

/** L'utilisateur connecté accuse réception / accepte le règlement intérieur. */
export async function acceptReglement(
  _prev: FormResult | null,
  _formData: FormData
): Promise<FormResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Veuillez vous connecter." };

  // Version selon le PARCOURS du candidat (univers), pas selon la finance.
  const version = getReglement(await resolveUserIsBootcamp(user.id)).version;

  const { error } = await supabase
    .from("reglement_acceptances")
    .upsert(
      { user_id: user.id, version, accepted_at: new Date().toISOString() },
      { onConflict: "user_id,version" }
    );
  if (error) return { ok: false, message: error.message };

  revalidatePath("/espace/reglement");
  return { ok: true, message: "Lecture confirmée. Merci !" };
}
