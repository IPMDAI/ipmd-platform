/**
 * Mise en forme LÉGÈRE et SÛRE des messages (client + serveur) :
 *  - échappe tout le HTML (anti-injection) ;
 *  - `**gras**` → <strong> ;
 *  - les retours à la ligne et listes (1. 2. 3.) sont préservés par `white-space: pre-line`.
 */
export function escapeMessageHtml(s: string): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderMessageHtml(body: string): string {
  // Échappement d'abord → on n'injecte ensuite QUE la balise <strong>.
  const esc = escapeMessageHtml(body);
  return esc.replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>");
}
