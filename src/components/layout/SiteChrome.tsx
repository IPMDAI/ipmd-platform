"use client";

import { usePathname } from "next/navigation";

/**
 * Décide d'afficher (ou non) le « chrome » du site marketing autour du contenu.
 * Sur l'espace d'admission sécurisé (`/admission/pack`), on retire le header, la
 * navigation, le footer et les widgets flottants (WhatsApp / assistante IA) pour
 * une page épurée, personnelle et sans distraction.
 *
 * Composition : le layout serveur rend les éléments (dont Footer, server, et
 * Header, client) et les passe en props — ce composant client choisit juste
 * lesquels rendre selon l'URL.
 */
export function SiteChrome({
  header,
  footer,
  floats,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  floats: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const bare = pathname?.startsWith("/admission/pack") ?? false;

  if (bare) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      {header}
      <main className="flex-1">{children}</main>
      {footer}
      {floats}
    </>
  );
}
