create extension if not exists pgcrypto;

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text not null,
  direccion text not null,
  cuota_mensual numeric not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists cobros (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  anio integer not null,
  mes integer not null check (mes between 1 and 12),
  monto numeric not null,
  estado text not null check (estado in ('pagado', 'pendiente')),
  fecha_pago date,
  observacion text,
  created_at timestamptz not null default now(),
  unique (cliente_id, anio, mes)
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  nombre text not null,
  rol text not null check (rol in ('admin', 'collector')),
  created_at timestamptz not null default now()
);

create table if not exists user_client_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  cliente_id uuid not null references clientes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, cliente_id)
);

create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and rol = 'admin'
  );
$$;

alter table clientes enable row level security;
alter table cobros enable row level security;
alter table profiles enable row level security;
alter table user_client_access enable row level security;

drop policy if exists "admins_manage_clientes" on clientes;
create policy "admins_manage_clientes"
on clientes
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "users_view_assigned_clientes" on clientes;
create policy "users_view_assigned_clientes"
on clientes
for select
to authenticated
using (
  (select private.is_admin())
  or id in (
    select cliente_id
    from user_client_access
    where user_id = auth.uid()
  )
);

drop policy if exists "admins_manage_cobros" on cobros;
create policy "admins_manage_cobros"
on cobros
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "users_manage_assigned_cobros" on cobros;
create policy "users_manage_assigned_cobros"
on cobros
for all
to authenticated
using (
  (select private.is_admin())
  or cliente_id in (
    select cliente_id
    from user_client_access
    where user_id = auth.uid()
  )
)
with check (
  (select private.is_admin())
  or cliente_id in (
    select cliente_id
    from user_client_access
    where user_id = auth.uid()
  )
);

drop policy if exists "admins_view_all_profiles" on profiles;
create policy "admins_view_all_profiles"
on profiles
for select
to authenticated
using ((select private.is_admin()));

drop policy if exists "users_view_own_profile" on profiles;
create policy "users_view_own_profile"
on profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "admins_insert_profiles" on profiles;
create policy "admins_insert_profiles"
on profiles
for insert
to authenticated
with check ((select private.is_admin()));

drop policy if exists "admins_update_profiles" on profiles;
create policy "admins_update_profiles"
on profiles
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "admins_view_all_access" on user_client_access;
create policy "admins_view_all_access"
on user_client_access
for select
to authenticated
using ((select private.is_admin()));

drop policy if exists "users_view_own_access" on user_client_access;
create policy "users_view_own_access"
on user_client_access
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "admins_manage_access" on user_client_access;
create policy "admins_manage_access"
on user_client_access
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));
