-- ─────────────────────────────────────────────────────────────────────────
-- Mecanisme de maintenance des maquettes base sur une IDENTITE DB technique
-- (pas de flag, pas d'usurpation d'identite utilisateur).
--  * role NOLOGIN dedie : maquette_maintenance ;
--  * fonction SECURITY DEFINER possedee par ce role ;
--  * le trigger guard_academic_status autorise reserve->actif UNIQUEMENT si
--    current_user est ce role (via la fonction) OU un vrai super_admin ;
--  * EXECUTE revoque a public/anon/authenticated, accorde a service_role ;
--  * search_path verrouille, tables explicites, revalidation structure, audit.
-- Idempotent. N'affaiblit aucune protection applicative existante.
-- ─────────────────────────────────────────────────────────────────────────

-- 1) Role technique NOLOGIN
do $$ begin
  if not exists (select 1 from pg_roles where rolname='maquette_maintenance') then
    create role maquette_maintenance nologin;
  end if;
end $$;
grant maquette_maintenance to postgres;                 -- pour ALTER FUNCTION OWNER
grant create on schema public to maquette_maintenance;  -- pour POSSEDER la fonction

-- 2) Table d'audit (hors de portee des roles applicatifs)
create table if not exists public.maquette_maintenance_log(
  id bigserial primary key,
  performed_at timestamptz not null default now(),
  action text not null,
  module_id uuid,
  old_status text,
  new_status text,
  detail text,
  performed_by text not null default current_user
);
revoke all on public.maquette_maintenance_log from public, anon, authenticated;
grant select on public.maquette_maintenance_log to service_role;

-- 3) Privileges minimaux du role technique
grant select, update on public.modules to maquette_maintenance;
grant select on public.unites_enseignement to maquette_maintenance;
grant select on public.academic_year_config to maquette_maintenance; -- lu par modules_credit_guard
grant insert on public.maquette_maintenance_log to maquette_maintenance;
grant usage on sequence public.maquette_maintenance_log_id_seq to maquette_maintenance;

-- 4) RLS: policy dediee AU SEUL role technique (modules a RLS actif ; les policies
--    applicatives scopees 'authenticated' restent inchangees).
drop policy if exists maquette_maintenance_all on public.modules;
create policy maquette_maintenance_all on public.modules as permissive for all
  to maquette_maintenance using (true) with check (true);

-- 5) Trigger ROLE-BASED (remplace la version precedente ; memes protections + role)
create or replace function public.guard_academic_status() returns trigger language plpgsql as $g1$
begin
  if public.current_user_role() is distinct from 'super_admin'
     and current_user <> 'maquette_maintenance'
     and NEW.status is distinct from OLD.status
     and NEW.status in ('valide','actif','refuse','archive','reserve') then
    NEW.status := OLD.status; -- ignore la tentative applicative
  end if;
  return NEW;
end $g1$;

-- 6) Fonction de maintenance (search_path verrouille, tables explicites, revalidation)
create or replace function public.admin_reactivate_reserve_module(
  p_id uuid, p_name text, p_ue_code text, p_credits int,
  p_c int, p_td int, p_tp int, p_proj int, p_stage int)
returns void language plpgsql security definer set search_path = '' as $g2$
declare v_fil uuid; v_ue uuid; v_old text;
begin
  select filiere_id, status into v_fil, v_old from public.modules where id = p_id;
  if v_fil is null then raise exception 'reactivate: module % inexistant', p_id; end if;
  if v_old <> 'reserve' then raise exception 'reactivate: module % non-reserve (statut=%)', p_id, v_old; end if;
  if p_credits <= 0 then raise exception 'reactivate: credits doit etre > 0 (recu %)', p_credits; end if;
  select id into v_ue from public.unites_enseignement where code=p_ue_code and filiere_id=v_fil
    and level='Licence 3' and semester='Semestre 6' and academic_year='2026-2027';
  if v_ue is null then raise exception 'reactivate: UE % introuvable pour la filiere', p_ue_code; end if;
  update public.modules set status='actif', name=p_name, level='Licence 3', semester='Semestre 6',
    credits=p_credits, heures_cours=p_c, heures_td=p_td, heures_tp=p_tp, heures_projet=p_proj,
    heures_stage=p_stage, ue_id=v_ue
  where id = p_id;  -- limite au seul id fourni
  insert into public.maquette_maintenance_log(action, module_id, old_status, new_status, detail, performed_by)
    values('reactivate_reserve_L3S6', p_id, v_old, 'actif',
           'Migration administrative L3-S6 : '||p_name||' (S6, UE '||p_ue_code||', '||p_credits||' cr)', current_user);
end $g2$;

alter function public.admin_reactivate_reserve_module(uuid,text,text,int,int,int,int,int,int) owner to maquette_maintenance;
revoke all on function public.admin_reactivate_reserve_module(uuid,text,text,int,int,int,int,int,int) from public;
revoke all on function public.admin_reactivate_reserve_module(uuid,text,text,int,int,int,int,int,int) from anon;
revoke all on function public.admin_reactivate_reserve_module(uuid,text,text,int,int,int,int,int,int) from authenticated;
grant execute on function public.admin_reactivate_reserve_module(uuid,text,text,int,int,int,int,int,int) to service_role;
