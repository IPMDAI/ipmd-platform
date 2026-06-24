"use client";

import { useActionState } from "react";
import { setProfileContacts } from "@/lib/admin-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

export type Contacts = {
  phone: string | null;
  whatsapp: string | null;
  personal_email: string | null;
  school_email: string | null;
};

export function ContactEditForm({
  userId,
  contacts,
}: {
  userId: string;
  contacts: Contacts;
}) {
  const bound = setProfileContacts.bind(null, userId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(bound, null);

  const has =
    contacts.phone || contacts.whatsapp || contacts.personal_email || contacts.school_email;

  return (
    <details className="mt-2 rounded-lg bg-ipmd-light/60 px-3 py-2 text-xs">
      <summary className="cursor-pointer font-semibold text-ipmd-black">
        📇 Coordonnées
        {has ? (
          <span className="ml-2 text-[11px] font-normal text-black/45">
            {[contacts.phone && `☎ ${contacts.phone}`, contacts.whatsapp && `🟢 ${contacts.whatsapp}`]
              .filter(Boolean)
              .join(" · ")}
          </span>
        ) : (
          <span className="ml-2 text-[11px] font-normal text-ipmd-red/70">à compléter</span>
        )}
      </summary>

      <form action={action} className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Téléphone" htmlFor={`ph-${userId}`}>
          <input id={`ph-${userId}`} name="phone" defaultValue={contacts.phone ?? ""} placeholder="+225 0700000000" className={inputBase} />
        </Field>
        <Field label="WhatsApp" htmlFor={`wa-${userId}`}>
          <input id={`wa-${userId}`} name="whatsapp" defaultValue={contacts.whatsapp ?? ""} placeholder="+225 0700000000" className={inputBase} />
        </Field>
        <Field label="Email personnel" htmlFor={`pe-${userId}`}>
          <input id={`pe-${userId}`} name="personal_email" type="email" defaultValue={contacts.personal_email ?? ""} placeholder="perso@email.com" className={inputBase} />
        </Field>
        <Field label="Email IPMD attribué" htmlFor={`se-${userId}`}>
          <input id={`se-${userId}`} name="school_email" type="email" defaultValue={contacts.school_email ?? ""} placeholder="prenom.nom@ipmd.pro" className={inputBase} />
        </Field>
        <div className="col-span-2 flex items-center gap-2">
          <ActionButton type="submit" disabled={pending}>
            {pending ? "…" : "Enregistrer"}
          </ActionButton>
          {state && (
            <span className={`text-[11px] font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>
              {state.message}
            </span>
          )}
        </div>
      </form>
    </details>
  );
}
