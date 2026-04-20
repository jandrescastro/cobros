create extension if not exists pgcrypto;

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text not null,
  direccion text not null,
  cuota_mensual numeric not null,
  dia_cobro_sugerido integer check (dia_cobro_sugerido between 1 and 31),
  responsable_cobro text check (responsable_cobro in ('JOSE', 'HECTOR')),
  owner_user_id uuid references auth.users(id) on delete set null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists cobros (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  anio integer not null,
  mes integer not null check (mes between 1 and 12),
  monto numeric not null,
  monto_original numeric,
  monto_abonado numeric,
  estado text not null check (estado in ('pagado', 'pendiente', 'abono')),
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
  gestiona_clientes_propios boolean not null default false,
  created_at timestamptz not null default now()
);

alter table clientes add column if not exists owner_user_id uuid references auth.users(id) on delete set null;
alter table clientes add column if not exists dia_cobro_sugerido integer;
alter table clientes add column if not exists responsable_cobro text;
alter table clientes drop constraint if exists clientes_dia_cobro_sugerido_check;
alter table clientes add constraint clientes_dia_cobro_sugerido_check check (dia_cobro_sugerido between 1 and 31);
alter table clientes drop constraint if exists clientes_responsable_cobro_check;
alter table clientes add constraint clientes_responsable_cobro_check check (responsable_cobro in ('JOSE', 'HECTOR'));
alter table profiles add column if not exists gestiona_clientes_propios boolean not null default false;
alter table cobros add column if not exists monto_original numeric;
alter table cobros add column if not exists monto_abonado numeric;
alter table cobros drop constraint if exists cobros_estado_check;
alter table cobros add constraint cobros_estado_check check (estado in ('pagado', 'pendiente', 'abono'));

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
drop policy if exists "authenticated_view_all_clientes" on clientes;
create policy "authenticated_view_all_clientes"
on clientes
for select
to authenticated
using (true);

drop policy if exists "users_insert_own_clientes" on clientes;
drop policy if exists "authenticated_insert_clientes" on clientes;
create policy "authenticated_insert_clientes"
on clientes
for insert
to authenticated
with check (true);

drop policy if exists "users_update_own_clientes" on clientes;
drop policy if exists "authenticated_update_clientes" on clientes;
create policy "authenticated_update_clientes"
on clientes
for update
to authenticated
using (true)
with check (true);

drop policy if exists "admins_manage_cobros" on cobros;
create policy "admins_manage_cobros"
on cobros
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "users_manage_assigned_cobros" on cobros;
drop policy if exists "authenticated_manage_cobros" on cobros;
create policy "authenticated_manage_cobros"
on cobros
for all
to authenticated
using (true)
with check (true);

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
