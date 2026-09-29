-- ─────────────────────────────────────────────────────────────────────────
-- Acceptation du règlement du PACK d'admission — enregistrement ATOMIQUE.
-- 1) Autorise le type d'événement 'reglement_accepted' dans admission_events.
-- 2) Fonction accept_pack_reglement : conservation de l'ancienne acceptation
--    (append-only), mise à jour du pack et journal de la nouvelle acceptation
--    réussissent ENSEMBLE ou sont TOUS annulés (une seule transaction plpgsql).
-- ─────────────────────────────────────────────────────────────────────────

alter table public.admission_events drop constraint if exists admission_events_kind_check;
alter table public.admission_events add constraint admission_events_kind_check
  check (kind = any (array['admission_sent'::text, 'deadline_renewed'::text, 'reglement_accepted'::text]));

create or replace function public.accept_pack_reglement(p_pack_id uuid, p_version text)
returns timestamptz
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_cand        uuid;
  v_old_version text;
  v_old_at      timestamptz;
  v_now         timestamptz := now();
begin
  -- Verrouille la ligne du pack (évite toute course sur l'acceptation).
  select candidature_id, reglement_version, reglement_accepted_at
    into v_cand, v_old_version, v_old_at
  from public.admission_packs
  where id = p_pack_id
  for update;

  if not found then
    raise exception 'pack introuvable: %', p_pack_id;
  end if;

  -- (a) Préserver une acceptation ANTÉRIEURE d'une AUTRE version (traçabilité).
  if v_cand is not null and v_old_at is not null and v_old_version is not null
     and v_old_version <> p_version then
    insert into public.admission_events (candidature_id, kind, note)
    values (
      v_cand,
      'reglement_accepted',
      v_old_version || ' accepté le ' || to_char(v_old_at, 'YYYY-MM-DD"T"HH24:MI:SSOF')
        || ' (remplacé par ' || p_version || ')'
    );
  end if;

  -- (b) Mettre à jour le pack.
  update public.admission_packs
     set reglement_accepted_at = v_now,
         reglement_version     = p_version,
         updated_at            = v_now
   where id = p_pack_id;

  -- (c) Journal de la NOUVELLE acceptation.
  if v_cand is not null then
    insert into public.admission_events (candidature_id, kind, note)
    values (
      v_cand,
      'reglement_accepted',
      p_version || ' accepté le ' || to_char(v_now, 'YYYY-MM-DD"T"HH24:MI:SSOF')
    );
  end if;

  return v_now;
end;
$$;

-- Appelée uniquement côté serveur (service-role). Pas d'accès direct client.
revoke all on function public.accept_pack_reglement(uuid, text) from public;
revoke all on function public.accept_pack_reglement(uuid, text) from anon;
revoke all on function public.accept_pack_reglement(uuid, text) from authenticated;
