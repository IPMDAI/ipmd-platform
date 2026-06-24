"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { setMyAvatar } from "@/lib/profile-actions";

const MAX = 4 * 1024 * 1024; // 4 Mo

export function AvatarUpload({
  userId,
  initialUrl,
  name,
}: {
  userId: string;
  initialUrl: string | null;
  name: string;
}) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMsg("Veuillez choisir une image.");
      return;
    }
    if (file.size > MAX) {
      setMsg("Image trop lourde (max 4 Mo).");
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setMsg("Service indisponible.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?v=${Date.now()}`;
      const res = await setMyAvatar(publicUrl);
      if (!res.ok) throw new Error(res.message);
      setUrl(publicUrl);
      setMsg("Photo mise à jour ✓");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Échec du téléversement.");
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async () => {
    setBusy(true);
    const res = await setMyAvatar(null);
    if (res.ok) {
      setUrl(null);
      setMsg("Photo retirée.");
    } else {
      setMsg(res.message);
    }
    setBusy(false);
  };

  return (
    <div className="flex items-center gap-4">
      <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ipmd-light ring-1 ring-black/10">
        {url ? (
          <Image src={url} alt={name} width={80} height={80} className="h-full w-full object-cover" unoptimized />
        ) : (
          <span className="text-xl font-bold text-black/30">{initials || "👤"}</span>
        )}
      </span>
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer rounded-full bg-ipmd-red px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90">
            {busy ? "…" : url ? "Changer la photo" : "Ajouter une photo"}
            <input type="file" accept="image/*" onChange={onPick} disabled={busy} className="hidden" />
          </label>
          {url && (
            <button
              type="button"
              onClick={onRemove}
              disabled={busy}
              className="rounded-full px-3 py-2 text-sm font-semibold text-ipmd-red transition-colors hover:bg-ipmd-red/10"
            >
              Retirer
            </button>
          )}
        </div>
        <p className="text-xs text-black/45">JPG ou PNG, max 4 Mo.</p>
        {msg && <p className="text-xs font-medium text-black/60">{msg}</p>}
      </div>
    </div>
  );
}
