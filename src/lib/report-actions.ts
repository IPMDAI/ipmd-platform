"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/types";

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}
function intOrNull(raw: string): number | null {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}

/** L'enseignant (ou un service) remplit la fiche pédagogique d'une séance. */
export async function saveSessionReport(
  sessionId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Service indisponible." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Veuillez vous connecter." };

  const [{ data: session }, { data: me }, { data: existing }] = await Promise.all([
    supabase.from("course_sessions").select("teacher_id, session_date").eq("id", sessionId).single(),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase.from("session_reports").select("validated").eq("session_id", sessionId).maybeSingle(),
  ]);
  if (!session) return { ok: false, message: "Séance introuvable." };
  if (existing?.validated) {
    return { ok: false, message: "Fiche déjà validée par la Pédagogie (non modifiable)." };
  }

  // Anti-triche : un enseignant ne remplit sa fiche QUE le jour du cours.
  // (La Pédagogie / l'administration peut corriger à tout moment.)
  const isStaff = ["super_admin", "admin", "pedagogie"].includes(me?.role ?? "");
  if (!isStaff) {
    const today = new Date().toISOString().slice(0, 10);
    if (session.session_date !== today) {
      return {
        ok: false,
        message:
          session.session_date > today
            ? "La fiche se remplit uniquement le jour du cours."
            : "Le jour du cours est passé : la fiche n'est plus modifiable. Contactez la Pédagogie.",
      };
    }
  }

  const { error } = await supabase.from("session_reports").upsert(
    {
      session_id: sessionId,
      teacher_id: session.teacher_id,
      content: str(formData, "content") || null,
      actual_start: str(formData, "actual_start") || null,
      actual_end: str(formData, "actual_end") || null,
      supports: str(formData, "supports") || null,
      homework: str(formData, "homework") || null,
      observations: str(formData, "observations") || null,
      present_count: intOrNull(str(formData, "present_count")),
      absent_count: intOrNull(str(formData, "absent_count")),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "session_id" }
  );
  if (error) return { ok: false, message: error.message };

  revalidatePath("/espace/mes-seances");
  revalidatePath("/espace/seances");
  return { ok: true, message: "Fiche enregistrée." };
}

/** La Pédagogie valide / invalide une fiche pédagogique. */
export async function validateSessionReport(
  reportId: string,
  validate: boolean,
  _formData?: FormData
): Promise<void> {
  const supabase = await createClient();
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!["admin", "super_admin", "pedagogie"].includes(me?.role ?? "")) return;

  await supabase
    .from("session_reports")
    .update({
      validated: validate,
      validated_by: validate ? user.id : null,
      validated_at: validate ? new Date().toISOString() : null,
    })
    .eq("id", reportId);
  revalidatePath("/espace/seances");
  revalidatePath("/espace/mes-seances");
}
