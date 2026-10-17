create table if not exists public.restablecimientos_contrasena (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  token_hash text not null unique,
  expira_en timestamptz not null,
  usado_en timestamptz,
  creado_en timestamptz not null default now()
);

create index if not exists restablecimientos_contrasena_usuario_id_idx
  on public.restablecimientos_contrasena (usuario_id);

alter table public.restablecimientos_contrasena enable row level security;
revoke all on public.restablecimientos_contrasena from anon, authenticated;
grant all on public.restablecimientos_contrasena to service_role;

create or replace function public.contar_solicitudes_recuperacion(p_usuario_id uuid)
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*)
  from public.restablecimientos_contrasena
  where usuario_id = p_usuario_id
    and creado_en >= now() - interval '15 minutes';
$$;

create or replace function public.crear_token_recuperacion(
  p_usuario_id uuid,
  p_token_hash text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  nuevo_id uuid;
begin
  insert into public.restablecimientos_contrasena (usuario_id, token_hash, expira_en)
  values (p_usuario_id, p_token_hash, now() + interval '30 minutes')
  returning id into nuevo_id;

  return nuevo_id;
end;
$$;

create or replace function public.invalidar_tokens_recuperacion(p_usuario_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.restablecimientos_contrasena
  set usado_en = now()
  where usuario_id = p_usuario_id
    and usado_en is null;
$$;

create or replace function public.consumir_token_recuperacion(p_token_hash text)
returns table (id uuid, usuario_id uuid)
language sql
security definer
set search_path = public
as $$
  update public.restablecimientos_contrasena as restablecimiento
  set usado_en = now()
  where restablecimiento.token_hash = p_token_hash
    and restablecimiento.usado_en is null
    and restablecimiento.expira_en > now()
  returning restablecimiento.id, restablecimiento.usuario_id;
$$;

revoke all on function public.contar_solicitudes_recuperacion(uuid) from public, anon, authenticated;
revoke all on function public.crear_token_recuperacion(uuid, text) from public, anon, authenticated;
revoke all on function public.invalidar_tokens_recuperacion(uuid) from public, anon, authenticated;
revoke all on function public.consumir_token_recuperacion(text) from public, anon, authenticated;
grant execute on function public.contar_solicitudes_recuperacion(uuid) to service_role;
grant execute on function public.crear_token_recuperacion(uuid, text) to service_role;
grant execute on function public.invalidar_tokens_recuperacion(uuid) to service_role;
grant execute on function public.consumir_token_recuperacion(text) to service_role;
