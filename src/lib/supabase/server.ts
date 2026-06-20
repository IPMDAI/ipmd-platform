import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./config";

/**
 * Client Supabase côté serveur (Server Components, Route Handlers, Server
 * Actions). Renvoie `null` tant que les clés ne sont pas configurées.
 */
export async function createClient() {
  if (!isSupabaseConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // `setAll` peut être appelé depuis un Server Component : sans
          // middleware de rafraîchissement de session, on ignore l'erreur.
        }
      },
    },
  });
}
