import { renderMessageHtml } from "@/lib/message-format";

/** Affiche un message : gras (**…**) + retours à la ligne / listes préservés. Contenu échappé (sûr). */
export function MessageText({ body, className = "" }: { body: string; className?: string }) {
  return (
    <p
      className={`whitespace-pre-line break-words ${className}`}
      dangerouslySetInnerHTML={{ __html: renderMessageHtml(body) }}
    />
  );
}
