"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/types";

async function getAdmin() {
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
  if (me?.role !== "super_admin" && me?.role !== "admin") return null;
  return { supabase };
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function numOrNull(raw: string): number | null {
  if (!raw) return null;
  const n = Number.parseFloat(raw.replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

/** Met à jour la fiche d'un module. */
export async function updateModule(
  moduleId: string,
  filiereId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  const name = str(formData, "name");
  if (!name) return { ok: false, message: "Le nom du module est requis." };

  const { error } = await ctx.supabase
    .from("modules")
    .update({
      name,
      level: str(formData, "level") || null,
      semester: str(formData, "semester") || null,
      teacher_id: str(formData, "teacher_id") || null,
      hours: numOrNull(str(formData, "hours")),
      coefficient: numOrNull(str(formData, "coefficient")),
      syllabus: str(formData, "syllabus") || null,
    })
    .eq("id", moduleId);
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/espace/module/${moduleId}`);
  revalidatePath(`/espace/classes/${filiereId}`);
  return { ok: true, message: "Module enregistré." };
}

/** Ajoute un support de cours à un module. */
export async function addModuleSupport(
  moduleId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  const label = str(formData, "label");
  if (!label) return { ok: false, message: "Le titre du support est requis." };
  const { error } = await ctx.supabase.from("module_supports").insert({
    module_id: moduleId,
    label,
    url: str(formData, "url") || null,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/espace/module/${moduleId}`);
  return { ok: true, message: "Support ajouté." };
}

export async function deleteModuleSupport(
  moduleId: string,
  supportId: string,
  _formData?: FormData
): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("module_supports").delete().eq("id", supportId);
  revalidatePath(`/espace/module/${moduleId}`);
}
