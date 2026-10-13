-- =============================================================================
-- Lot « Deadline d'admission 72 h » — journal d'audit admission_events
-- -----------------------------------------------------------------------------
-- Journalise les événements du cycle d'admission pour tracer notamment le
-- RENOUVELLEMENT SILENCIEUX du délai (distinct d'un envoi réel).
--   • admission_sent    : envoi réel de la lettre/email d'admission (sendAdmission)
--   • deadline_renewed  : renouvellement du délai 72 h par l'admin (email-free)
-- L'ancre du délai courant reste inscription_requests.admission_sent_at ;
-- ce journal conserve QUI / QUAND / motif, sans stocker la deadline elle-même.
-- =============================================================================

create table if not exists public.admission_events (
  id             uuid primary key default gen_random_uuid(),
  candidature_id uuid not null references public.inscription_requests(id) on delete cascade,
  kind           text not null check (kind in ('admission_sent', 'deadline_renewed')),
  actor_id       uuid,
  created_at     timestamptz not null default now(),
  note           text
);

create index if not exists admission_events_candidature_idx
  on public.admission_events (candidature_id, created_at desc);

-- RLS : lecture réservée à l'administration ; écriture admin (service_role bypass).
alter table public.admission_events enable row level security;

drop policy if exists "admission_events admin read" on public.admission_events;
create policy "admission_events admin read" on public.admission_events
  for select
  using (public.current_user_role() in ('super_admin', 'admin'));

drop policy if exists "admission_events admin write" on public.admission_events;
create policy "admission_events admin write" on public.admission_events
  for insert
  with check (public.current_user_role() in ('super_admin', 'admin'));

-- =============================================================================
-- RPC ATOMIQUE : renouvellement silencieux du délai 72 h + audit, en 1 seule TX.
-- Un unique `renewed_at` sert d'ancre ET de created_at de l'événement. Si l'insert
-- de l'événement échoue, la mise à jour de l'ancre est ROLLBACKée (atomicité).
-- STRICTEMENT email-free : n'écrit que admission_sent_at + admission_events.
-- Sécurité : SECURITY DEFINER, search_path='', EXECUTE réservé à service_role
-- (l'autorisation admin/super_admin est vérifiée dans l'action serveur appelante).
-- =============================================================================
create or replace function public.renew_admission_deadline(
  p_candidature uuid,
  p_actor       uuid,
  p_note        text default null
) returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status  text;
  v_renewed timestamptz;
begin
  if p_candidature is null then
    raise exception 'renew_admission_deadline: candidature manquante';
  end if;

  select status into v_status
    from public.inscription_requests
   where id = p_candidature
   for update;
  if not found then
    raise exception 'renew_admission_deadline: candidature introuvable';
  end if;
  if v_status is distinct from 'en_attente_paiement' then
    raise exception 'renew_admission_deadline: statut % (attendu en_attente_paiement)', v_status;
  end if;

  v_renewed := now();

  update public.inscription_requests
     set admission_sent_at = v_renewed
   where id = p_candidature;

  insert into public.admission_events (candidature_id, kind, actor_id, created_at, note)
  values (p_candidature, 'deadline_renewed', p_actor, v_renewed, nullif(btrim(coalesce(p_note, '')), ''));

  return v_renewed;
end;
$$;

revoke all on function public.renew_admission_deadline(uuid, uuid, text) from public;
revoke all on function public.renew_admission_deadline(uuid, uuid, text) from anon;
revoke all on function public.renew_admission_deadline(uuid, uuid, text) from authenticated;
grant execute on function public.renew_admission_deadline(uuid, uuid, text) to service_role;
