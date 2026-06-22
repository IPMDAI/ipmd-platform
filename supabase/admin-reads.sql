-- ──────────────────────────────────────────────────────────────
-- IPMD — Lecture admin des candidatures et messages
-- À exécuter dans Supabase > SQL Editor APRÈS roles-rbac.sql
-- (utilise la fonction public.current_user_role()).
-- Permet aux admins (super_admin + admin) de LIRE les demandes
-- d'inscription et les messages de contact.
-- ──────────────────────────────────────────────────────────────

drop policy if exists "Admins read inscriptions" on public.inscription_requests;
create policy "Admins read inscriptions"
  on public.inscription_requests for select
  to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'));

drop policy if exists "Admins read contact messages" on public.contact_messages;
create policy "Admins read contact messages"
  on public.contact_messages for select
  to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'));
