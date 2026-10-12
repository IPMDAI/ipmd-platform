-- ─────────────────────────────────────────────────────────────────────────
-- B4 : blocages calendrier + exceptions tracées + fonctions.
--  • blocks_all : vacances/fériés = blocage TOTAL ; examens = blocks_regular seul.
--  • course_sessions : exception_reason / _authorized_by (→ profiles) / _authorized_at.
--  • planning_block_reason(année,date,type) → motif de blocage ou NULL.
--  • weekly_rule_alert(année,programme,jour,type) → alerte souple ou NULL.
-- ─────────────────────────────────────────────────────────────────────────
begin;

alter table public.academic_calendar add column if not exists blocks_all boolean not null default false;
update public.academic_calendar set blocks_all = true
  where academic_year='2026-2027' and kind='vacances';

alter table public.course_sessions add column if not exists exception_reason text;
alter table public.course_sessions add column if not exists exception_authorized_by uuid references public.profiles(id);
alter table public.course_sessions add column if not exists exception_authorized_at timestamptz;

create or replace function public.planning_block_reason(p_year text, p_date date, p_type text)
returns text language sql stable security definer set search_path = public, pg_temp as $f$
  select case
    when exists(select 1 from public.holidays where day = p_date) then 'Jour férié'
    when exists(select 1 from public.academic_calendar
                where academic_year = p_year and blocks_all
                  and p_date between start_date and end_date) then 'Vacances / fermeture'
    when exists(select 1 from public.academic_calendar ac
                where ac.academic_year = p_year and ac.blocks_regular
                  and p_date between ac.start_date and ac.end_date)
         and exists(select 1 from public.session_types st where st.code = p_type and st.is_regular)
         then 'Examens : cours réguliers suspendus'
    else null end;
$f$;

create or replace function public.weekly_rule_alert(p_year text, p_program text, p_dow int, p_type text)
returns text language sql stable security definer set search_path = public, pg_temp as $f$
  select case
    when (r.rules #> array['days', p_dow::text, 'allowed_types']) ? p_type then null
    else 'Type « ' || p_type || ' » inhabituel pour ce jour (alerte, non bloquant)'
  end
  from public.campus_schedule_rules r
  where r.academic_year = p_year and r.program_type = p_program;
$f$;

grant execute on function public.planning_block_reason(text, date, text) to authenticated;
grant execute on function public.weekly_rule_alert(text, text, int, text) to authenticated;

commit;
