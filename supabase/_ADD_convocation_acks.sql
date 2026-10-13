-- P3c (correctif) — Accusé de réception PAR DESTINATAIRE.
-- Avant : convocations.status='vue' + acknowledged_at étaient GLOBAUX (incorrect si
-- plusieurs parents/tuteurs). Désormais : status = cycle de vie administratif de la
-- convocation ; l'accusé est individuel dans une table dédiée.
-- 0 convocation réelle à ce stade → aucune donnée à migrer.

-- 1) status ne porte plus que le cycle de vie (plus de 'vue' global).
alter table public.convocations drop constraint if exists convocations_status_check;
alter table public.convocations
  add constraint convocations_status_check
  check (status in ('envoyee','honoree','annulee'));

-- 2) Accusés individuels.
create table if not exists public.convocation_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  convocation_id uuid not null references public.convocations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  unique (convocation_id, user_id)
);
create index if not exists convocation_acks_convocation_idx
  on public.convocation_acknowledgements(convocation_id);

alter table public.convocation_acknowledgements enable row level security;

-- Un utilisateur crée SON PROPRE accusé, uniquement pour une convocation à laquelle
-- il a accès (étudiant concerné ou parent lié).
drop policy if exists "Ack own for accessible convocation" on public.convocation_acknowledgements;
create policy "Ack own for accessible convocation" on public.convocation_acknowledgements
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.convocations c
      where c.id = convocation_id
        and (c.student_id = auth.uid() or public.is_parent_of(c.student_id))
    )
  );

-- Chacun lit son propre accusé.
drop policy if exists "Read own ack" on public.convocation_acknowledgements;
create policy "Read own ack" on public.convocation_acknowledgements
  for select using (user_id = auth.uid());

-- Le staff consulte tous les accusés (pour afficher Vu/Non vu par destinataire).
drop policy if exists "Staff read acks" on public.convocation_acknowledgements;
create policy "Staff read acks" on public.convocation_acknowledgements
  for select using (
    (current_user_role())::text = any (array['admin','super_admin','scolarite','pedagogie'])
  );
