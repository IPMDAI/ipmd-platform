-- ──────────────────────────────────────────────────────────────
-- IPMD — Rôles Scolarité & Pédagogie + routage de la messagerie
-- À exécuter dans Supabase > SQL Editor APRÈS internal-messages.sql.
-- ⚠️ Si erreur « ALTER TYPE ... cannot run inside a transaction »,
--    exécute d'abord SEULES les 2 lignes « alter type » ci-dessous,
--    puis relance le reste.
-- ──────────────────────────────────────────────────────────────

alter type public.user_role add value if not exists 'scolarite';
alter type public.user_role add value if not exists 'pedagogie';

-- Service destinataire d'un message (admin | scolarite | pedagogie).
alter table public.internal_messages
  add column if not exists recipient_role text not null default 'admin';

-- Lecture par service.
drop policy if exists "Scolarite read messages" on public.internal_messages;
create policy "Scolarite read messages" on public.internal_messages
  for select to authenticated
  using (public.current_user_role() = 'scolarite' and recipient_role = 'scolarite');

drop policy if exists "Pedagogie read messages" on public.internal_messages;
create policy "Pedagogie read messages" on public.internal_messages
  for select to authenticated
  using (public.current_user_role() = 'pedagogie' and recipient_role = 'pedagogie');

-- Réponse par service.
drop policy if exists "Scolarite reply messages" on public.internal_messages;
create policy "Scolarite reply messages" on public.internal_messages
  for update to authenticated
  using (public.current_user_role() = 'scolarite' and recipient_role = 'scolarite')
  with check (public.current_user_role() = 'scolarite' and recipient_role = 'scolarite');

drop policy if exists "Pedagogie reply messages" on public.internal_messages;
create policy "Pedagogie reply messages" on public.internal_messages
  for update to authenticated
  using (public.current_user_role() = 'pedagogie' and recipient_role = 'pedagogie')
  with check (public.current_user_role() = 'pedagogie' and recipient_role = 'pedagogie');
