-- ──────────────────────────────────────────────────────────────
-- IPMD — Demande d'inscription enrichie + anti-doublon
-- Champs dossier + fonction publique pour bloquer les demandes
-- multiples (sans exposer les données).
-- À exécuter dans Supabase > SQL Editor.
-- ──────────────────────────────────────────────────────────────

alter table public.inscription_requests
  add column if not exists last_education text;
alter table public.inscription_requests
  add column if not exists last_diploma text;

-- Une demande « nouveau » (non traitée) existe-t-elle déjà pour cet
-- email ou ce téléphone ? Renvoie seulement un booléen (aucune donnée).
create or replace function public.has_pending_inscription(p_email text, p_phone text)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.inscription_requests
    where status = 'nouveau'
      and (
        (p_email is not null and p_email <> '' and lower(email) = lower(p_email))
        or (p_phone is not null and p_phone <> '' and phone = p_phone)
      )
  );
$$;

grant execute on function public.has_pending_inscription(text, text) to anon, authenticated;
