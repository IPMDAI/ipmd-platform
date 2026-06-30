-- ══════════════════════════════════════════════════════════════
-- IPMD — Autoriser les admins à SUPPRIMER les messages de contact
-- (nettoyage du spam). À exécuter dans Supabase > SQL Editor.
-- Nécessite public.current_user_role() (roles-rbac.sql).
-- ══════════════════════════════════════════════════════════════

drop policy if exists "Admins delete contact messages" on public.contact_messages;
create policy "Admins delete contact messages"
  on public.contact_messages for delete
  to authenticated
  using (public.current_user_role() in ('super_admin', 'admin'));
