"use client";

import { useState } from "react";

/**
 * Champ fichier multiple : un input par fichier, avec un bouton « + Ajouter »
 * pour en joindre plusieurs (ex. plusieurs bulletins). Tous partagent le même
 * `name` → récupérables via formData.getAll(name) côté serveur.
 */
export function MultiFileField({
  name,
  accept,
  className,
  addLabel = "+ Ajouter un fichier",
}: {
  name: string;
  accept?: string;
  className?: string;
  addLabel?: string;
}) {
  const [count, setCount] = useState(1);

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <input key={i} type="file" name={name} accept={accept} className={className} />
      ))}
      <button
        type="button"
        onClick={() => setCount((c) => c + 1)}
        className="text-xs font-semibold text-ipmd-red transition-colors hover:underline"
      >
        {addLabel}
      </button>
    </div>
  );
}
