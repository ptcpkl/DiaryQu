-- DiaryQu family foundation
-- Source of truth: Supabase PostgreSQL + RLS.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 1 and 100),
  avatar_url text,
  phone_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 100),
  family_code text not null unique,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint families_family_code_format_check
    check (family_code ~ '^DQ-[A-F0-9]{6}$')
);

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('head', 'member')),
  joined_at timestamptz not null default now(),
  constraint family_members_family_user_unique unique (family_id, user_id)
);

create index if not exists family_members_user_id_idx
  on public.family_members(user_id);

create index if not exists family_members_family_id_role_idx
  on public.family_members(family_id, role);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, phone_number)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'User'
    ),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(new.raw_user_meta_data ->> 'phone_number', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Backfill profiles for auth users that existed before this migration.
insert into public.profiles (id, full_name, avatar_url, phone_number)
select
  users.id,
  coalesce(
    nullif(trim(users.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(users.email, ''), '@', 1), ''),
    'User'
  ),
  nullif(users.raw_user_meta_data ->> 'avatar_url', ''),
  nullif(users.raw_user_meta_data ->> 'phone_number', '')
from auth.users as users
on conflict (id) do nothing;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists families_set_updated_at on public.families;
create trigger families_set_updated_at
before update on public.families
for each row execute function public.set_updated_at();

create or replace function public.is_family_member(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.family_members
    where family_id = target_family_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_family_head(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.family_members
    where family_id = target_family_id
      and user_id = auth.uid()
      and role = 'head'
  );
$$;

create or replace function public.shares_family_with(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.family_members as mine
    join public.family_members as theirs
      on theirs.family_id = mine.family_id
    where mine.user_id = auth.uid()
      and theirs.user_id = target_user_id
  );
$$;

create or replace function public.generate_family_code()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  candidate text;
begin
  loop
    candidate := 'DQ-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
    exit when not exists (
      select 1 from public.families where family_code = candidate
    );
  end loop;

  return candidate;
end;
$$;

create or replace function public.create_family(p_name text)
returns table (
  family_id uuid,
  family_name text,
  family_code text,
  role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  created_family public.families%rowtype;
begin
  if actor_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  if p_name is null or char_length(trim(p_name)) < 2 then
    raise exception using errcode = '22023', message = 'INVALID_FAMILY_NAME';
  end if;

  insert into public.profiles (id, full_name)
  select
    users.id,
    coalesce(
      nullif(trim(users.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(users.email, ''), '@', 1), ''),
      'User'
    )
  from auth.users as users
  where users.id = actor_id
  on conflict (id) do nothing;

  insert into public.families (name, family_code, created_by)
  values (trim(p_name), public.generate_family_code(), actor_id)
  returning * into created_family;

  insert into public.family_members (family_id, user_id, role)
  values (created_family.id, actor_id, 'head');

  return query
  select created_family.id, created_family.name, created_family.family_code, 'head'::text;
end;
$$;

create or replace function public.join_family(p_family_code text)
returns table (
  family_id uuid,
  family_name text,
  family_code text,
  role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_family public.families%rowtype;
  assigned_role text;
begin
  if actor_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  if p_family_code is null or trim(p_family_code) = '' then
    raise exception using errcode = '22023', message = 'INVALID_FAMILY_CODE';
  end if;

  select *
  into target_family
  from public.families
  where family_code = upper(trim(p_family_code));

  if not found then
    raise exception using errcode = 'P0002', message = 'FAMILY_NOT_FOUND';
  end if;

  insert into public.profiles (id, full_name)
  select
    users.id,
    coalesce(
      nullif(trim(users.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(users.email, ''), '@', 1), ''),
      'User'
    )
  from auth.users as users
  where users.id = actor_id
  on conflict (id) do nothing;

  insert into public.family_members (family_id, user_id, role)
  values (target_family.id, actor_id, 'member')
  on conflict (family_id, user_id) do nothing;

  select members.role
  into assigned_role
  from public.family_members as members
  where members.family_id = target_family.id
    and members.user_id = actor_id;

  return query
  select target_family.id, target_family.name, target_family.family_code, assigned_role;
end;
$$;

alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;

-- Profiles: users can read their own profile and profiles of people in a shared family.
drop policy if exists profiles_select_shared_family on public.profiles;
create policy profiles_select_shared_family
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.shares_family_with(id)
);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Families are visible to members; only a head can mutate family metadata directly.
drop policy if exists families_select_member on public.families;
create policy families_select_member
on public.families
for select
to authenticated
using (public.is_family_member(id));

drop policy if exists families_update_head on public.families;
create policy families_update_head
on public.families
for update
to authenticated
using (public.is_family_head(id))
with check (public.is_family_head(id));

-- Memberships are readable inside the room. Writes are intentionally RPC-only.
drop policy if exists family_members_select_member on public.family_members;
create policy family_members_select_member
on public.family_members
for select
to authenticated
using (public.is_family_member(family_id));

revoke all on function public.handle_new_user() from public;
revoke all on function public.generate_family_code() from public;

revoke all on function public.is_family_member(uuid) from public;
revoke all on function public.is_family_head(uuid) from public;
revoke all on function public.shares_family_with(uuid) from public;
revoke all on function public.create_family(text) from public;
revoke all on function public.join_family(text) from public;

grant execute on function public.is_family_member(uuid) to authenticated;
grant execute on function public.is_family_head(uuid) to authenticated;
grant execute on function public.shares_family_with(uuid) to authenticated;
grant execute on function public.create_family(text) to authenticated;
grant execute on function public.join_family(text) to authenticated;

grant select, update on public.profiles to authenticated;
grant select, update on public.families to authenticated;
grant select on public.family_members to authenticated;
