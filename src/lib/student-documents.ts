/** Documents à fournir — constantes partagées. */
export const STUDENT_DOCS_BUCKET = "student-documents";
export const ALLOWED_DOC_TYPES = ["application/pdf", "image/jpeg", "image/png"];
export const ALLOWED_DOC_HINT = "PDF, JPG, JPEG ou PNG — 10 Mo max";
export const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10 Mo

/** État courant d'une demande de document. */
export const DOC_STATUS: Record<string, { label: string; cls: string }> = {
  a_fournir: { label: "À fournir", cls: "bg-amber-50 text-amber-800" },
  fourni: { label: "Fourni · en attente", cls: "bg-blue-50 text-blue-700" },
  valide: { label: "Validé ✓", cls: "bg-green-50 text-green-700" },
  refuse: { label: "Refusé", cls: "bg-ipmd-red/10 text-ipmd-red" },
};

export type StudentDocument = {
  id: string;
  student_id: string;
  label: string;
  doc_key: string | null;
  status: string;
  requested_at: string;
};

export type DocSubmission = {
  id: string;
  student_document_id: string;
  path: string;
  original_name: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
  status: string;
  reviewed_at: string | null;
  review_note: string | null;
};

/** Extension de fichier normalisée à partir du type MIME. */
export function extForType(type: string): string {
  if (type === "application/pdf") return "pdf";
  if (type === "image/png") return "png";
  return "jpg"; // image/jpeg
}
