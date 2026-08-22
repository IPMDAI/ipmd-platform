import { createClient } from "@/lib/supabase/server";
import {
  EMPTY_CATALOG,
  sortLevels,
  type CampusIntake,
  type CatalogProgram,
  type DocProfileRow,
  type DocRequirement,
  type WizardCatalog,
} from "@/components/wizard/project";

/**
 * Charge le catalogue « projet » de l'Étape 3 — UNIQUEMENT depuis la base, avec
 * le client anon (RLS publiques). Rien n'est codé en dur.
 *
 *  - Campus     : rentrées `open` + `intake_offerings` `open` + noms de filières.
 *  - Certificat : `catalog_items` `open` (visibles anon car type needs_intake=false),
 *                 groupés par univers.
 *  - Pro/Exec   : `catalog_offerings` `open` → items `open` (univers pro/gouvernance)
 *                 sous rentrée `open`. NB : tant que les items Pro/Executive
 *                 (needs_intake=true) n'ont pas de politique de lecture anon,
 *                 la jointure ne renvoie rien pour le public — ce qui, avec 0
 *                 offre ouverte aujourd'hui, se traduit par l'état vide attendu.
 */
export async function loadWizardCatalog(): Promise<WizardCatalog> {
  const supabase = await createClient();
  if (!supabase) return EMPTY_CATALOG;

  const [
    { data: intakeData },
    { data: offerData },
    { data: filiereData },
    { data: catOfferData },
    { data: docTypeData },
    { data: docProfileData },
  ] = await Promise.all([
    supabase
      .from("intakes")
      .select("id,label,academic_year,start_date,sort_order")
      .eq("status", "open")
      .order("academic_year", { ascending: false })
      .order("sort_order"),
    supabase.from("intake_offerings").select("intake_id,filiere_id,level").eq("status", "open"),
    supabase.from("filieres").select("id,name"),
    supabase.from("catalog_offerings").select("id,item_id,intake_id,level").eq("status", "open"),
    supabase.from("document_types").select("doc_key,label,max_files"),
    supabase.from("document_profiles").select("profile_key,doc_key,requirement,sort_order"),
  ]);

  // ── Campus : rentrées ouvertes + leurs offres ouvertes (filière · niveau) ──
  const filiereName = new Map((filiereData ?? []).map((f) => [f.id as string, f.name as string]));
  const offersByIntake = new Map<string, { filiereId: string; filiereName: string; level: string }[]>();
  for (const o of offerData ?? []) {
    const arr = offersByIntake.get(o.intake_id as string) ?? [];
    arr.push({
      filiereId: o.filiere_id as string,
      filiereName: filiereName.get(o.filiere_id as string) ?? "(filière)",
      level: o.level as string,
    });
    offersByIntake.set(o.intake_id as string, arr);
  }
  const campusIntakes: CampusIntake[] = (intakeData ?? [])
    .map((i) => ({
      id: i.id as string,
      label: i.label as string,
      academicYear: i.academic_year as string,
      startDate: (i.start_date as string) ?? null,
      offerings: (offersByIntake.get(i.id as string) ?? []).sort(
        (a, b) => a.filiereName.localeCompare(b.filiereName) || sortLevels(a.level, b.level),
      ),
    }))
    .filter((i) => i.offerings.length > 0);

  // ── Pro / Executive / Certificats : via catalog_offerings ouverts (offering-based) ──
  const proPrograms: CatalogProgram[] = [];
  const execPrograms: CatalogProgram[] = [];
  const certByUniverse: Record<string, CatalogProgram[]> = {};
  const offers = catOfferData ?? [];
  if (offers.length) {
    // NB : on lit TOUS les items ouverts (pas de `.in(id, [...])`) — une longue liste
    // d'UUID dépasse la limite d'URL et tronque le résultat de façon non déterministe.
    // Les items ouverts anon = exactement ceux ayant une offre ouverte (policy dédiée).
    const [{ data: items }, { data: ints }] = await Promise.all([
      supabase
        .from("catalog_items")
        .select("id,name,credential,universe,doc_profile,category,cert_tier,duration_months,price,registration_fee")
        .eq("status", "open"),
      supabase.from("intakes").select("id,label,academic_year").eq("status", "open"),
    ]);
    const itemById = new Map((items ?? []).map((i) => [i.id as string, i]));
    const intById = new Map((ints ?? []).map((i) => [i.id as string, i]));
    for (const o of offers) {
      const it = itemById.get(o.item_id as string);
      const ik = intById.get(o.intake_id as string);
      if (!it || !ik) continue; // rentrée fermée ou item non lisible → ignoré
      const prog: CatalogProgram = {
        offeringId: o.id as string,
        intakeId: ik.id as string,
        intakeLabel: ik.label as string,
        academicYear: ik.academic_year as string,
        itemId: it.id as string,
        name: it.name as string,
        credential: (it.credential as string) ?? null,
        docProfile: (it.doc_profile as string) ?? null,
        level: (o.level as string) ?? null,
        category: (it.category as string) ?? null,
        certTier: (it.cert_tier as string) ?? null,
        durationMonths: (it.duration_months as number) ?? null,
        price: (it.price as number) ?? null,
        registrationFee: (it.registration_fee as number) ?? null,
      };
      if (it.universe === "professionnel") proPrograms.push(prog);
      else if (it.universe === "gouvernance") execPrograms.push(prog);
      else (certByUniverse[it.universe as string] ??= []).push(prog);
    }
  }

  // ── Profils documentaires (Étape 4) ──
  const documentTypes: Record<string, string> = {};
  const documentMaxFiles: Record<string, number> = {};
  for (const t of docTypeData ?? []) {
    documentTypes[t.doc_key as string] = t.label as string;
    const mf = t.max_files as number | null;
    if (typeof mf === "number" && mf > 0) documentMaxFiles[t.doc_key as string] = mf;
  }

  const documentProfiles: Record<string, DocProfileRow[]> = {};
  for (const r of docProfileData ?? []) {
    (documentProfiles[r.profile_key as string] ??= []).push({
      docKey: r.doc_key as string,
      requirement: r.requirement as DocRequirement,
      sortOrder: (r.sort_order as number) ?? 0,
    });
  }

  // documentMaxFiles : lu depuis document_types.max_files (Lot B appliqué).
  // maxFilesForDoc applique le repli uniquement si un doc_key n'a pas de valeur.
  return {
    campusIntakes,
    proPrograms,
    execPrograms,
    certByUniverse,
    documentTypes,
    documentMaxFiles,
    documentProfiles,
  };
}
