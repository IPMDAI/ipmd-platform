"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { updatePartner, deletePartner, setPartnerLogo } from "@/lib/partner-actions";
import { PARTNER_CATEGORIES } from "@/lib/partners";
import type { Partner } from "@/lib/partners";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

export function PartnerRow({ p }: { p: Partner }) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    updatePartner.bind(null, p.id),
    null
  );
  const [logo, setLogo] = useState<string | null>(p.logo_url);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMsg("Choisissez une image."); return; }
    if (file.size > 3 * 1024 * 1024) { setMsg("Logo trop lourd (max 3 Mo)."); return; }
    const supabase = createClient();
    if (!supabase) return;
    setBusy(true);
    setMsg(null);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${p.id}/logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("partner-logos").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("partner-logos").getPublicUrl(path);
      const url = `${data.publicUrl}?v=${Date.now()}`;
      const res = await setPartnerLogo(p.id, url);
      if (!res.ok) throw new Error(res.message);
      setLogo(url);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Échec du téléversement.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ipmd-light ring-1 ring-black/10">
          {logo ? (
            <Image src={logo} alt={p.name} width={56} height={56} className="h-full w-full object-contain" unoptimized />
          ) : (
            <span className="text-lg">{p.category === "academique" ? "🎓" : p.category === "association" ? "🤝" : "🏢"}</span>
          )}
        </span>
        <details className="min-w-0 flex-1">
          <summary className="cursor-pointer">
            <span className="font-bold text-ipmd-black">{p.name}</span>
            {p.status === "inactif" && <span className="ml-2 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold text-black/40">Inactif</span>}
            {p.website && <span className="ml-2 text-[11px] text-black/40">{p.website}</span>}
          </summary>

          <div className="mt-3 space-y-3">
            <label className="inline-block cursor-pointer rounded-full bg-ipmd-black px-3 py-1.5 text-xs font-semibold text-white">
              {busy ? "…" : logo ? "Changer le logo" : "📷 Ajouter un logo"}
              <input type="file" accept="image/*" onChange={onLogo} disabled={busy} className="hidden" />
            </label>
            {logo && (
              <button type="button" onClick={async () => { await setPartnerLogo(p.id, null); setLogo(null); }} className="ml-2 text-xs font-semibold text-ipmd-red">Retirer le logo</button>
            )}
            {msg && <p className="text-xs text-ipmd-red">{msg}</p>}

            <form action={action} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Nom" htmlFor={`n-${p.id}`} required>
                  <input id={`n-${p.id}`} name="name" defaultValue={p.name} required className={inputBase} />
                </Field>
                <Field label="Catégorie" htmlFor={`c-${p.id}`}>
                  <select id={`c-${p.id}`} name="category" defaultValue={p.category} className={inputBase}>
                    {PARTNER_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.short}</option>)}
                  </select>
                </Field>
                <Field label="Site web" htmlFor={`w-${p.id}`}>
                  <input id={`w-${p.id}`} name="website" defaultValue={p.website ?? ""} placeholder="https://…" className={inputBase} />
                </Field>
                <Field label="Statut" htmlFor={`s-${p.id}`}>
                  <select id={`s-${p.id}`} name="status" defaultValue={p.status} className={inputBase}>
                    <option value="actif">Actif (visible)</option>
                    <option value="inactif">Inactif (masqué)</option>
                  </select>
                </Field>
              </div>
              <Field label="Description (optionnel)" htmlFor={`d-${p.id}`}>
                <textarea id={`d-${p.id}`} name="description" defaultValue={p.description ?? ""} rows={2} className={inputBase} />
              </Field>
              <div className="flex items-center gap-2">
                <ActionButton type="submit" disabled={pending}>{pending ? "…" : "Enregistrer"}</ActionButton>
                <button type="button" onClick={() => { if (confirm(`Supprimer ${p.name} ?`)) deletePartner(p.id); }} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ipmd-red hover:bg-ipmd-red/10">Supprimer</button>
                {state && <span className={`text-xs ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>{state.message}</span>}
              </div>
            </form>
          </div>
        </details>
      </div>
    </li>
  );
}
