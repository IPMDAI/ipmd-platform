import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

/**
 * Client Supabase « service role » — contourne la RLS. À utiliser
 * UNIQUEMENT côté serveur, dans des actions réservées au Super Admin
 * (ex. création de comptes). La clé n'est jamais exposée au client.
 */
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const canAdminUsers = SERVICE_KEY.length > 0 && supabaseUrl.length > 0;

export function createAdminClient() {
  if (!canAdminUsers) return null;
  return createClient(supabaseUrl, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
