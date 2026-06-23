"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TEACHER_STATUS_VALUES } from "@/lib/teacher";
import type { FormResult } from "@/types";

async function getStaff() {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!["admin", "super_admin", "pedagogie"].includes(me?.role ?? "")) return null;
  return { supabase };
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** Enregistre / met à jour la fiche d'un enseignant. */
export async function saveTeacherProfile(
  teacherId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getStaff();
  if (!ctx) return { ok: false, message: "Action réservée aux services IPMD." };

  let status = str(formData, "status");
  if (!TEACHER_STATUS_VALUES.includes(status)) status = "en_attente";

  const { error } = await ctx.supabase.from("teacher_profiles").upsert(
    {
      teacher_id: teacherId,
      phone: str(formData, "phone") || null,
      function: str(formData, "function") || null,
      title: str(formData, "title") || null,
      specialty: str(formData, "specialty") || null,
      availability: str(formData, "availability") || null,
      cv_url: str(formData, "cv_url") || null,
      diplomas: str(formData, "diplomas") || null,
      authorization: str(formData, "authorization") || null,
      civilite: str(formData, "civilite") || null,
      prenoms: str(formData, "prenoms") || null,
      type_piece: str(formData, "type_piece") || null,
      num_piece: str(formData, "num_piece") || null,
      nationalite: str(formData, "nationalite") || null,
      date_naissance: str(formData, "date_naissance") || null,
      situation_matrimoniale: str(formData, "situation_matrimoniale") || null,
      pays_residence: str(formData, "pays_residence") || null,
      ville_residence: str(formData, "ville_residence") || null,
      diploma_date: str(formData, "diploma_date") || null,
      diploma_school: str(formData, "diploma_school") || null,
      emergency_name: str(formData, "emergency_name") || null,
      emergency_phone: str(formData, "emergency_phone") || null,
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "teacher_id" }
  );
  if (error) return { ok: false, message: error.message };

  revalidatePath("/espace/enseignants");
  revalidatePath("/espace/paie");
  return { ok: true, message: "Fiche enregistrée." };
}
