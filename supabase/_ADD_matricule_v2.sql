-- ─────────────────────────────────────────────────────────────────────────
-- Matricule étudiant v2 — format IPMD-{num}EA{AADEB}{AAFIN}R{MM}
-- (ex. IPMD-597EA2627R10). Numéro global incrémental (dès 597), figé à la 1re
-- attribution, jamais modifié ensuite. S'applique à partir de 2026-2027.
-- ─────────────────────────────────────────────────────────────────────────
create sequence if not exists public.matricule_seq start with 597;

create or replace function public.assign_matricule(p_student uuid, p_academic_year text, p_month text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v_mat text; v_ea text; v_num bigint;
begin
  select matricule into v_mat from public.profiles where id = p_student;
  if v_mat is not null then return v_mat; end if;   -- idempotent / jamais modifié
  v_ea := right(split_part(p_academic_year,'-',1),2) || right(split_part(p_academic_year,'-',2),2);
  v_num := nextval('public.matricule_seq');
  v_mat := 'IPMD-' || v_num || 'EA' || v_ea || 'R' || lpad(p_month, 2, '0');
  update public.profiles set matricule = v_mat where id = p_student;
  return v_mat;
end $$;

revoke all on function public.assign_matricule(uuid, text, text) from public, anon, authenticated;
grant execute on function public.assign_matricule(uuid, text, text) to service_role;

-- Unicité du matricule (ignore les NULL).
create unique index if not exists profiles_matricule_key on public.profiles (matricule) where matricule is not null;
