import { requireAdmin } from "@/lib/require-admin";

/**
 * Preview READ-ONLY de la campagne de réinscription (admin).
 *
 * Calcule, pour chaque étudiant 2025-2026, le passage proposé vers 2026-2027 —
 * SANS aucune écriture. Le mapping de niveau est figé :
 *   Licence 1 → Licence 2 → Licence 3 → Master 1 → Master 2 (fin de cycle).
 */

export const REENROLL_YEAR = "2026-2027";
export const SOURCE_YEAR = "2025-2026";

const NEXT_LEVEL: Record<string, string | null> = {
  "Licence 1": "Licence 2",
  "Licence 2": "Licence 3",
  "Licence 3": "Master 1",
  "Master 1": "Master 2",
  "Master 2": null,
};

export type ReenrollStatus =
  | "eligible"
  | "cas_particulier"
  | "fin_de_cycle"
  | "classe_cible_manquante"
  | "deja_prepare";

export type ReenrollRow = {
  studentId: string;
  fullName: string;
  currentClassId: string;
  currentClassName: string;
  currentLevel: string;
  filiereId: string | null;
  filiereName: string | null;
  nextLevel: string | null;
  toClassId: string | null;
  toClassName: string | null;
  registrationFee: number | null;
  tuition: number | null;
  status: ReenrollStatus;
  reason: string | null;
};

export type ReenrollPreview = {
  year: string;
  rows: ReenrollRow[];
  counters: {
    eligible: number;
    cas_particulier: number;
    fin_de_cycle: number;
    classe_cible_manquante: number;
    deja_prepare: number;
    total: number;
  };
  registrationFee: number | null;
  lumpSumDiscount: number | null;
};

const EMPTY: ReenrollPreview = {
  year: REENROLL_YEAR,
  rows: [],
  counters: { eligible: 0, cas_particulier: 0, fin_de_cycle: 0, classe_cible_manquante: 0, deja_prepare: 0, total: 0 },
  registrationFee: null,
  lumpSumDiscount: null,
};

export async function loadReenrollmentPreview(): Promise<ReenrollPreview> {
  const ctx = await requireAdmin();
  const supabase = ctx.supabase;
  if (!supabase) return EMPTY;

  const [
    { data: members },
    { data: classes },
    { data: filieres },
    { data: levels },
    { data: settings },
    { data: existing },
  ] = await Promise.all([
    supabase.from("class_members").select("student_id, class_id"),
    supabase.from("classes").select("id, name, level, academic_year, filiere_id"),
    supabase.from("filieres").select("id, name"),
    supabase.from("tuition_levels").select("level, amount"),
    supabase.from("finance_settings").select("registration_fee, lump_sum_discount").eq("academic_year", REENROLL_YEAR).maybeSingle(),
    supabase.from("reenrollments").select("student_id").eq("academic_year", REENROLL_YEAR),
  ]);

  const classById = new Map((classes ?? []).map((c) => [c.id as string, c]));
  const filiereName = new Map((filieres ?? []).map((f) => [f.id as string, f.name as string]));
  const tuitionByLevel = new Map((levels ?? []).map((l) => [l.level as string, Number(l.amount)]));
  const alreadyPrepared = new Set((existing ?? []).map((r) => r.student_id as string));
  const regFee = settings?.registration_fee != null ? Number(settings.registration_fee) : null;

  // Index des classes cibles 2026-2027 par (filiere_id | level)
  const targetByKey = new Map<string, { id: string; name: string }>();
  for (const c of classes ?? []) {
    if (c.academic_year === REENROLL_YEAR && c.filiere_id) {
      targetByKey.set(`${c.filiere_id}|${c.level}`, { id: c.id as string, name: c.name as string });
    }
  }

  const studentName = new Map<string, string>();
  const sids = [...new Set((members ?? []).map((m) => m.student_id as string))];
  if (sids.length) {
    const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", sids);
    for (const p of profs ?? []) studentName.set(p.id as string, (p.full_name as string) ?? "");
  }

  const rows: ReenrollRow[] = [];
  for (const m of members ?? []) {
    const c = classById.get(m.class_id as string);
    if (!c || c.academic_year !== SOURCE_YEAR) continue; // uniquement la cohorte 2025-2026

    const filiereId = (c.filiere_id as string) ?? null;
    const curLevel = c.level as string;
    const nextLevel = curLevel in NEXT_LEVEL ? NEXT_LEVEL[curLevel] : null;
    const target = filiereId && nextLevel ? targetByKey.get(`${filiereId}|${nextLevel}`) ?? null : null;

    let status: ReenrollStatus;
    let reason: string | null = null;
    if (alreadyPrepared.has(m.student_id as string)) {
      status = "deja_prepare";
      reason = "Réinscription déjà préparée pour 2026-2027.";
    } else if (curLevel === "Master 2" || nextLevel === null) {
      status = "fin_de_cycle";
      reason = "Dernière année de cycle — pas de passage automatique.";
    } else if (!filiereId) {
      status = "cas_particulier";
      reason = "Filière non renseignée sur la classe 2025-2026 (à corriger pour mapper automatiquement).";
    } else if (!target) {
      status = "classe_cible_manquante";
      reason = `Aucune classe 2026-2027 « ${nextLevel} » pour cette filière.`;
    } else {
      status = "eligible";
    }

    rows.push({
      studentId: m.student_id as string,
      fullName: studentName.get(m.student_id as string) ?? "(sans nom)",
      currentClassId: c.id as string,
      currentClassName: c.name as string,
      currentLevel: curLevel,
      filiereId,
      filiereName: filiereId ? filiereName.get(filiereId) ?? null : null,
      nextLevel,
      toClassId: target?.id ?? null,
      toClassName: target?.name ?? null,
      registrationFee: regFee,
      tuition: nextLevel ? tuitionByLevel.get(nextLevel) ?? null : null,
      status,
      reason,
    });
  }

  rows.sort((a, b) => a.status.localeCompare(b.status) || (a.filiereName ?? "").localeCompare(b.filiereName ?? ""));

  const counters = {
    eligible: rows.filter((r) => r.status === "eligible").length,
    cas_particulier: rows.filter((r) => r.status === "cas_particulier").length,
    fin_de_cycle: rows.filter((r) => r.status === "fin_de_cycle").length,
    classe_cible_manquante: rows.filter((r) => r.status === "classe_cible_manquante").length,
    deja_prepare: rows.filter((r) => r.status === "deja_prepare").length,
    total: rows.length,
  };

  return {
    year: REENROLL_YEAR,
    rows,
    counters,
    registrationFee: regFee,
    lumpSumDiscount: settings?.lump_sum_discount != null ? Number(settings.lump_sum_discount) : null,
  };
}
