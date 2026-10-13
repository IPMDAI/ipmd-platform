-- P3a — Message direct staff → destinataire (ex. parent).
-- Additif : recipient_id NULL = ticket service classique (comportement inchangé) ;
-- renseigné = message direct initié par un service IPMD vers un utilisateur précis.
alter table public.internal_messages
  add column if not exists recipient_id uuid references public.profiles(id) on delete set null;

-- Le destinataire peut lire les messages qui lui sont adressés.
drop policy if exists "Read received messages" on public.internal_messages;
create policy "Read received messages" on public.internal_messages
  for select using (recipient_id = auth.uid());

-- Défense : seul le staff peut viser un destinataire direct (un non-staff ne peut
-- insérer qu'un ticket service, recipient_id NULL). RESTRICTIVE = condition ET.
drop policy if exists "Direct message staff only" on public.internal_messages;
create policy "Direct message staff only" on public.internal_messages
  as restrictive for insert to authenticated
  with check (
    recipient_id is null
    or (current_user_role())::text = any (array['admin','super_admin','scolarite','pedagogie'])
  );
