"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/types";

/**
 * Actions « Années & Rentrées ».
 *
 * ⚠️ Elles utilisent le client Supabase AUTHENTIFIÉ de l'admin (session), jamais
 * service_role : les écritures passent par la RLS « Admins manage », et les RPC
 * `open_intake` / `close_intake` / `activate_academic_year` (SECURITY DEFINER)
 * vérifient `current_user_role()` — ce qui nécessite le JWT de l'admin.
 */

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
  return { supabase, role: me.role as string, userId: user.id };
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function revalidate() {
  revalidatePath("/espace/annees-rentrees");
  revalidatePath("/espace/candidatures");
}

const YEAR_RE = /^\d{4}-\d{4}$/;

/** Crée une année académique (statut « preparation »). */
export async function createAcademicYear(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  const year = str(formData, "year");
  if (!YEAR_RE.test(year)) return { ok: false, message: "Format d'année invalide (attendu AAAA-AAAA)." };

  const { error } = await ctx.supabase.from("academic_years").insert({ year, status: "preparation" });
  if (error) {
    if (error.code === "23505") return { ok: false, message: `L'année ${year} existe déjà.` };
    return { ok: false, message: error.message };
  }
  revalidate();
  return { ok: true, message: `Année ${year} créée (préparation).` };
}

/** Active une année de FONCTIONNEMENT (super_admin uniquement). */
export async function activateYear(year: string): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  if (ctx.role !== "super_admin")
    return { ok: false, message: "Activer une année est réservé au Super Admin." };

  const { error } = await ctx.supabase.rpc("activate_academic_year", { p_year: year });
  if (error) return { ok: false, message: error.message };
  revalidate();
  return { ok: true, message: `Année de fonctionnement → ${year}.` };
}

/** Crée une rentrée (label libre, date de début des cours, fenêtre de candidatures). */
export async function createIntake(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  const academic_year = str(formData, "academic_year");
  const label = str(formData, "label");
  if (!YEAR_RE.test(academic_year)) return { ok: false, message: "Année invalide." };
  if (!label) return { ok: false, message: "Le libellé de la rentrée est requis." };

  const row: Record<string, unknown> = {
    academic_year,
    label,
    status: "preparation",
    sort_order: Number(str(formData, "sort_order") || "0") || 0,
  };
  const start = str(formData, "start_date");
  const appsOpen = str(formData, "applications_open_at");
  const appsClose = str(formData, "applications_close_at");
  if (start) row.start_date = start;
  if (appsOpen) row.applications_open_at = appsOpen;
  if (appsClose) row.applications_close_at = appsClose;

  const { error } = await ctx.supabase.from("intakes").insert(row);
  if (error) {
    if (error.code === "23505") return { ok: false, message: `La rentrée « ${label} » existe déjà pour ${academic_year}.` };
    if (error.code === "23514") return { ok: false, message: "Fenêtre de candidatures incohérente (ouverture après fermeture)." };
    return { ok: false, message: error.message };
  }
  revalidate();
  return { ok: true, message: `Rentrée « ${label} » créée (préparation).` };
}

/** Déclare une offre (filière + niveau) pour une rentrée, en « planned ». */
export async function addOffering(
  _prev: FormResult | null,
  formData: FormData
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  const intake_id = str(formData, "intake_id");
  const filiere_id = str(formData, "filiere_id");
  const level = str(formData, "level");
  if (!intake_id || !filiere_id || !level)
    return { ok: false, message: "Rentrée, filière et niveau sont requis." };

  const { error } = await ctx.supabase
    .from("intake_offerings")
    .insert({ intake_id, filiere_id, level, status: "planned" });
  if (error) {
    if (error.code === "23505") return { ok: false, message: "Cette offre (filière + niveau) existe déjà pour cette rentrée." };
    return { ok: false, message: error.message };
  }
  revalidate();
  return { ok: true, message: "Offre ajoutée (à préparer)." };
}

/**
 * Change le statut d'une offre. Passer à « open » déclenche le trigger DB
 * `offering_requires_class` : refusé s'il n'existe pas exactement 1 classe.
 */
export async function setOfferingStatus(
  offeringId: string,
  status: "planned" | "open" | "closed"
): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };

  const { error } = await ctx.supabase
    .from("intake_offerings")
    .update({ status })
    .eq("id", offeringId);
  if (error) return { ok: false, message: error.message };
  revalidate();
  return { ok: true, message: `Offre → ${status}.` };
}

/** Ouvre une rentrée aux candidatures (RPC gardée : ≥1 offre open, chacune avec 1 classe). */
export async function openIntake(intakeId: string): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  const { error } = await ctx.supabase.rpc("open_intake", { p_intake_id: intakeId });
  if (error) return { ok: false, message: error.message };
  revalidate();
  return { ok: true, message: "Rentrée ouverte aux candidatures." };
}

/** Ferme une rentrée aux candidatures (n'affecte aucune candidature déposée). */
export async function closeIntake(intakeId: string): Promise<FormResult> {
  const ctx = await getAdmin();
  if (!ctx) return { ok: false, message: "Action réservée à l'administration." };
  const { error } = await ctx.supabase.rpc("close_intake", { p_intake_id: intakeId });
  if (error) return { ok: false, message: error.message };
  revalidate();
  return { ok: true, message: "Rentrée fermée." };
}
