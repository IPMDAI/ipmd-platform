"use client";

import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./config";

/**
 * Client Supabase côté navigateur.
 *
 * Renvoie `null` tant que les clés ne sont pas configurées, ce qui permet
 * aux composants d'afficher un mode démo sans planter.
 */
export function createClient() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
