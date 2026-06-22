-- ──────────────────────────────────────────────────────────────
-- IPMD — Gouvernance académique : statut + validation Super Admin
-- À exécuter dans Supabase > SQL Editor APRÈS modules.sql.
-- Seul le Super Admin peut valider / activer / refuser / archiver.
-- ──────────────────────────────────────────────────────────────

alter table public.filieres add column if not exists status text not null default 'en_attente';
alter table public.modules add column if not exists status text not null default 'en_attente';

-- Le contenu déjà en place (créé par le Super Admin) reste actif.
update public.filieres set status = 'actif' where status = 'en_attente';
update public.modules set status = 'actif' where status = 'en_attente';

-- Verrou : un non-Super-Admin ne peut pas passer un élément en
-- valide / actif / refuse / archive (statuts de validation).
create or replace function public.guard_academic_status()
returns trigger language plpgsql as $$
begin
  if public.current_user_role() is distinct from 'super_admin'
     and NEW.status is distinct from OLD.status
     and NEW.status in ('valide', 'actif', 'refuse', 'archive') then
    NEW.status := OLD.status; -- ignore la tentative
  end if;
  return NEW;
end;
$$;

drop trigger if exists guard_filiere_status on public.filieres;
create trigger guard_filiere_status before update on public.filieres
  for each row execute function public.guard_academic_status();

drop trigger if exists guard_module_status on public.modules;
create trigger guard_module_status before update on public.modules
  for each row execute function public.guard_academic_status();
