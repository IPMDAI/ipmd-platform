-- ──────────────────────────────────────────────────────────────
-- IPMD — Validation des notes (bulletin officiel)
-- Les notes saisies par l'enseignant restent « en_attente ». Le bulletin
-- officiel n'est délivré que lorsque l'administration les a validées.
-- À exécuter dans Supabase > SQL Editor APRÈS grades.sql.
-- ──────────────────────────────────────────────────────────────

alter table public.grades
  add column if not exists status text not null default 'en_attente';

-- Les notes déjà saisies sont considérées comme validées (continuité).
update public.grades set status = 'valide' where status = 'en_attente';

-- L'administration peut modifier les notes (pour les valider).
drop policy if exists "Admins update grades" on public.grades;
create policy "Admins update grades" on public.grades
  for update to authenticated
  using (public.current_user_role() in ('admin', 'super_admin'))
  with check (public.current_user_role() in ('admin', 'super_admin'));

-- Garde-fou : seul un admin / super admin peut passer une note à « valide ».
-- Une note insérée/éditée par un enseignant reste « en_attente ».
create or replace function public.guard_grade_status()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if public.current_user_role() not in ('admin', 'super_admin') then
    if TG_OP = 'INSERT' then
      NEW.status := 'en_attente';
    elsif NEW.status is distinct from OLD.status then
      NEW.status := OLD.status;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists guard_grade_status on public.grades;
create trigger guard_grade_status
  before insert or update on public.grades
  for each row execute function public.guard_grade_status();
