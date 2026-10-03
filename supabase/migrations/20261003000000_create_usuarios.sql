-- The password and login credential stay in Supabase Auth (auth.users).
-- This table stores only the application profile for each email-based user.
create table if not exists public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre_completo text not null default '',
  email text not null unique,
  rol text not null default 'usuario' check (rol in ('admin', 'usuario')),
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.usuarios enable row level security;

revoke all on table public.usuarios from anon, authenticated;
grant select on table public.usuarios to authenticated;

drop policy if exists usuarios_select_self on public.usuarios;
create policy usuarios_select_self
  on public.usuarios
  for select
  to authenticated
  using (id = (select auth.uid()));

create or replace function public.sync_usuario_from_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null then
    return new;
  end if;

  insert into public.usuarios as current_profile (id, nombre_completo, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.email
  )
  on conflict (id) do update
    set email = excluded.email,
        nombre_completo = coalesce(nullif(current_profile.nombre_completo, ''), excluded.nombre_completo),
        updated_at = now();

  return new;
end;
$$;

revoke all on function public.sync_usuario_from_auth() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_sync_usuario on auth.users;
create trigger on_auth_user_created_sync_usuario
  after insert on auth.users
  for each row execute function public.sync_usuario_from_auth();

insert into public.usuarios (id, nombre_completo, email)
select
  id,
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', ''),
  email
from auth.users
where email is not null
on conflict (id) do nothing;
