"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { IPMD_FILIERES, LEVEL_FROM_DEGREE } from "@/lib/referentiel";
import { ACADEMIC_STATUS_VALUES } from "@/lib/academic";
import { programs } from "@/data/programs";
import { programDetails } from "@/data/programDetails";
import type { FormResult } from "@/types";

/** Contexte admin (admin ou super_admin), sinon null. */
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
  return { supabase, role: me.role as string };
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function createFiliere(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  const name = str(formData, "name");
  if (!name) return { ok: false, message: "Le nom de la filière est requis." };
  const { error } = await ctx.supabase.from("filieres").insert({ name });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/espace/classes");
  return { ok: true, message: "Filière créée." };
}

/** Importe les filières standard de l'IPMD (sans doublon). */
export async function seedFilieres(_formData?: FormData): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;
  const { data: existing } = await ctx.supabase.from("filieres").select("name");
  const have = new Set((existing ?? []).map((f) => f.name));
  const toAdd = IPMD_FILIERES.filter((n) => !have.has(n)).map((name) => ({
    name,
  }));
  if (toAdd.length > 0) {
    await ctx.supabase.from("filieres").insert(toAdd);
  }
  revalidatePath("/espace/classes");
}

export async function createClasse(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  const name = str(formData, "name");
  if (!name) return { ok: false, message: "Le nom de la classe est requis." };
  const tuitionRaw = str(formData, "tuition_amount").replace(",", ".");
  const tuition = tuitionRaw ? Number.parseFloat(tuitionRaw) : null;
  const { error } = await ctx.supabase.from("classes").insert({
    name,
    filiere_id: str(formData, "filiere_id") || null,
    level: str(formData, "level") || null,
    academic_year: str(formData, "academic_year") || null,
    intake: str(formData, "intake") || null,
    class_type: str(formData, "class_type") || null,
    partner_name: str(formData, "partner_name") || null,
    start_date: str(formData, "start_date") || null,
    end_date: str(formData, "end_date") || null,
    payment_regime: str(formData, "payment_regime") || null,
    tuition_amount: tuition != null && !Number.isNaN(tuition) ? tuition : null,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/espace/classes");
  return { ok: true, message: "Classe créée." };
}

/**
 * Pré-remplit les modules par filière → niveau → semestre, à partir du
 * vrai programme LMD (src/data/programDetails.ts). Remplace l'ancien
 * pré-remplissage plat (modules sans niveau).
 */
export async function seedModules(_formData?: FormData): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;

  const { data: filieres } = await ctx.supabase
    .from("filieres")
    .select("id, name");
  const byName = new Map((filieres ?? []).map((f) => [f.name, f.id]));

  // Retire l'ancien pré-remplissage (modules sans niveau).
  await ctx.supabase.from("modules").delete().is("level", null);

  const { data: existing } = await ctx.supabase
    .from("modules")
    .select("filiere_id, level, semester, name");
  const have = new Set(
    (existing ?? []).map(
      (m) => `${m.filiere_id}|${m.level}|${m.semester}|${m.name}`
    )
  );

  const rows: {
    filiere_id: string;
    level: string;
    semester: string;
    name: string;
  }[] = [];

  for (const p of programs) {
    if (p.universe !== "campus") continue; // une formation campus = une filière
    const fid = byName.get(p.title);
    if (!fid) continue;
    const detail = programDetails[p.id];
    if (!detail) continue;

    for (const lvl of detail.levels) {
      const level = LEVEL_FROM_DEGREE[lvl.level] ?? lvl.level;
      for (const sem of lvl.semesters) {
        for (const course of sem.courses) {
          const key = `${fid}|${level}|${sem.name}|${course}`;
          if (have.has(key)) continue;
          have.add(key);
          rows.push({
            filiere_id: fid,
            level,
            semester: sem.name,
            name: course,
          });
        }
      }
    }
  }

  // Insertion par lots.
  for (let i = 0; i < rows.length; i += 100) {
    await ctx.supabase.from("modules").insert(rows.slice(i, i + 100));
  }
  revalidatePath("/espace/classes");
}

/** Change le statut de validation d'une filière (Super Admin uniquement). */
export async function setFiliereStatus(
  filiereId: string,
  status: string
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  if (ctx.role !== "super_admin") {
    return { ok: false, message: "Validation réservée au Super Admin." };
  }
  if (!ACADEMIC_STATUS_VALUES.includes(status)) {
    return { ok: false, message: "Statut invalide." };
  }
  const { error } = await ctx.supabase
    .from("filieres")
    .update({ status })
    .eq("id", filiereId);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/espace/classes");
  return { ok: true, message: "Statut mis à jour." };
}

/** Ajoute un module à une filière. */
export async function createModule(
  filiereId: string,
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  const name = str(formData, "name");
  if (!name) return { ok: false, message: "Le nom du module est requis." };
  const { error } = await ctx.supabase.from("modules").insert({
    filiere_id: filiereId,
    name,
    level: str(formData, "level") || null,
    semester: str(formData, "semester") || null,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath(`/espace/classes/${filiereId}`);
  return { ok: true, message: "Module ajouté." };
}

export async function deleteModule(
  filiereId: string,
  moduleId: string,
  _formData?: FormData
): Promise<void> {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("modules").delete().eq("id", moduleId);
  revalidatePath(`/espace/classes/${filiereId}`);
}

export async function createRoom(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  const name = str(formData, "name");
  if (!name) return { ok: false, message: "Le nom de la salle est requis." };
  const capacityRaw = str(formData, "capacity");
  const capacity = capacityRaw ? Number.parseInt(capacityRaw, 10) : null;
  const { error } = await ctx.supabase.from("rooms").insert({
    name,
    capacity: Number.isNaN(capacity as number) ? null : capacity,
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/espace/salles");
  return { ok: true, message: "Salle créée." };
}

/** Affecte (ou réaffecte) un étudiant à une classe. classId vide = retire. */
export async function setStudentClass(
  studentId: string,
  classId: string
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  if (!classId) {
    const { error } = await ctx.supabase
      .from("class_members")
      .delete()
      .eq("student_id", studentId);
    if (error) return { ok: false, message: error.message };
    revalidatePath("/espace/classes");
    return { ok: true, message: "Retiré." };
  }

  const { error } = await ctx.supabase
    .from("class_members")
    .upsert(
      { student_id: studentId, class_id: classId },
      { onConflict: "student_id" }
    );
  if (error) return { ok: false, message: error.message };
  revalidatePath("/espace/classes");
  return { ok: true, message: "Affecté." };
}

/** Suppressions simples (actions de formulaire). */
export async function deleteFiliere(id: string, _formData?: FormData) {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("filieres").delete().eq("id", id);
  revalidatePath("/espace/classes");
}

export async function deleteClasse(id: string, _formData?: FormData) {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("classes").delete().eq("id", id);
  revalidatePath("/espace/classes");
}

export async function deleteRoom(id: string, _formData?: FormData) {
  const ctx = await getAdmin();
  if (!ctx) return;
  await ctx.supabase.from("rooms").delete().eq("id", id);
  revalidatePath("/espace/salles");
}
