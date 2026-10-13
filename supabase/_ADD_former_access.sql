-- Outil « Donner l'accès à un ancien » — travaille UNIQUEMENT sur le compte existant.

-- 1) Journal d'audit.
create table if not exists public.former_access_grants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  old_email text,
  new_email text not null,
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  identity_repaired boolean not null default false
);
alter table public.former_access_grants enable row level security;
drop policy if exists "Super admin reads access grants" on public.former_access_grants;
create policy "Super admin reads access grants" on public.former_access_grants for select
  using ((current_user_role())::text = 'super_admin');

-- 2) Statut d'identité Auth (affichage avant action). Lecture seule.
create or replace function public.former_auth_status(p_ids uuid[])
  returns table(id uuid, has_identity boolean, auth_email text, email_confirmed boolean)
  language sql stable security definer set search_path to 'public', 'auth' as $$
  select u.id,
         exists (select 1 from auth.identities i where i.user_id = u.id) as has_identity,
         u.email as auth_email,
         u.email_confirmed_at is not null as email_confirmed
  from auth.users u
  where u.id = any (p_ids);
$$;
grant execute on function public.former_auth_status(uuid[]) to authenticated;

-- 3) Donne l'accès : met à jour l'email Auth + profil, répare l'identité si absente,
--    SANS créer de nouveau compte, sans toucher scolarité/finance/matricule.
--    Retourne {old_email, identity_repaired}. Lève email_taken / user_not_found.
create or replace function public.grant_former_access(p_user_id uuid, p_new_email text)
  returns jsonb language plpgsql security definer set search_path to 'public', 'auth' as $$
declare
  v_old_email text;
  v_repaired boolean := false;
begin
  p_new_email := lower(trim(p_new_email));
  if p_new_email is null or p_new_email = '' then
    raise exception 'email_required';
  end if;
  if exists (select 1 from auth.users where lower(email) = p_new_email and id <> p_user_id) then
    raise exception 'email_taken';
  end if;
  select email into v_old_email from auth.users where id = p_user_id;
  if v_old_email is null and not found then
    raise exception 'user_not_found';
  end if;

  update auth.users
    set email = p_new_email,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
    where id = p_user_id;

  update public.profiles set email = p_new_email where id = p_user_id;

  if exists (select 1 from auth.identities where user_id = p_user_id and provider = 'email') then
    update auth.identities
      set identity_data = jsonb_build_object('sub', p_user_id::text, 'email', p_new_email),
          updated_at = now()
      where user_id = p_user_id and provider = 'email';
  else
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      values (gen_random_uuid(), p_user_id, p_user_id::text,
              jsonb_build_object('sub', p_user_id::text, 'email', p_new_email), 'email', now(), now(), now());
    v_repaired := true;
  end if;

  return jsonb_build_object('old_email', v_old_email, 'identity_repaired', v_repaired);
end;
$$;
grant execute on function public.grant_former_access(uuid, text) to service_role;
