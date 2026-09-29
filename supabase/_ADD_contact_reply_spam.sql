-- Messages de contact : marquage spam + trace de réponse.
alter table public.contact_messages
  add column if not exists is_spam boolean not null default false,
  add column if not exists replied_at timestamptz;
