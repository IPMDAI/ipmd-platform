import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./config";

/**
 * Rafraîchit la session Supabase à chaque requête (cookies) et la rend
 * disponible aux Server Components. Appelé depuis le middleware Next.js.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Sans clés Supabase, on ne fait rien (site en mode démo).
  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT : rafraîchit le token si nécessaire.
  await supabase.auth.getUser();

  return response;
}
