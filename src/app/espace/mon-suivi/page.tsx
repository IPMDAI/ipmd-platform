import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";

/** Raccourci enseignant → son propre suivi pédagogique. */
export default async function MonSuiviPage() {
  const { userId } = await requireUser();
  redirect(`/espace/suivi-pedagogique/${userId}`);
}
