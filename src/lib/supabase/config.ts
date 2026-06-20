/**
 * Configuration Supabase centralisée.
 *
 * Le site doit fonctionner même sans clés (mode démo). On expose donc un
 * indicateur `isSupabaseConfigured` que le reste du code peut tester avant
 * de tenter une connexion réelle.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
