-- DiaryQu currently models one active Family Room per authenticated user.
-- Keep this invariant in the database instead of relying on client state.

create unique index if not exists family_members_user_id_unique
  on public.family_members(user_id);

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

  if exists (
    select 1 from public.family_members where user_id = actor_id
  ) then
    raise exception using errcode = '23505', message = 'ALREADY_IN_FAMILY';
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
  existing_family_id uuid;
  existing_role text;
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

  select members.family_id, members.role
  into existing_family_id, existing_role
  from public.family_members as members
  where members.user_id = actor_id;

  if found then
    if existing_family_id = target_family.id then
      return query
      select target_family.id, target_family.name, target_family.family_code, existing_role;
      return;
    end if;

    raise exception using errcode = '23505', message = 'ALREADY_IN_FAMILY';
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
  values (target_family.id, actor_id, 'member');

  return query
  select target_family.id, target_family.name, target_family.family_code, 'member'::text;
end;
$$;

revoke all on function public.create_family(text) from public;
revoke all on function public.join_family(text) from public;
grant execute on function public.create_family(text) to authenticated;
grant execute on function public.join_family(text) to authenticated;
