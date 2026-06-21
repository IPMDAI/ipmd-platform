import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/** Maintient la session Supabase à jour sur toutes les pages. */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Toutes les routes sauf les fichiers statiques et images.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
