-- ──────────────────────────────────────────────────────────────
-- IPMD — Pipeline d'inscription : statut des candidatures
-- À exécuter dans Supabase > SQL Editor APRÈS schema.sql + admin-reads.sql.
-- ──────────────────────────────────────────────────────────────

alter table public.inscription_requests
  add column if not exists status text not null default 'nouveau';
alter table public.inscription_requests
  add column if not exists admin_note text;

-- Les admins peuvent faire évoluer le statut d'une candidature.
drop policy if exists "Admins update inscription_requests" on public.inscription_requests;
create policy "Admins update inscription_requests"
  on public.inscription_requests
  for update to authenticated
  using (public.current_user_role() in ('admin', 'super_admin'))
  with check (public.current_user_role() in ('admin', 'super_admin'));
