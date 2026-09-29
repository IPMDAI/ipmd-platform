"use server";

import { retryReglementEmail } from "@/lib/reglement-emails";
import type { FormResult } from "@/types";

/** Relance (admin) d'un email d'acceptation en échec — sur la même ligne. */
export async function retryReglementEmailAction(id: string): Promise<FormResult> {
  return retryReglementEmail(id);
}
