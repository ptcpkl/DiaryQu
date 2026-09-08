-- DiaryQu Profile + Family Room settings
-- Run after 20260906144300_family_foundation.sql.

-- A Family Room must have at most one active Head.
create unique index if not exists family_members_one_head_per_family_idx
  on public.family_members(family_id)
  where role = 'head';

create or replace function public.update_family_name(
  p_family_id uuid,
  p_name text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  normalized_name text := trim(coalesce(p_name, ''));
begin
  if actor_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;
  if not public.is_family_head(p_family_id) then
    raise exception using errcode = '42501', message = 'HEAD_REQUIRED';
  end if;
  if char_length(normalized_name) < 2 or char_length(normalized_name) > 100 then
    raise exception using errcode = '22023', message = 'INVALID_FAMILY_NAME';
  end if;

  update public.families
  set name = normalized_name
  where id = p_family_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'FAMILY_NOT_FOUND';
  end if;

  return normalized_name;
end;
$$;

create or replace function public.regenerate_family_code(
  p_family_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  next_code text;
begin
  if actor_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;
  if not public.is_family_head(p_family_id) then
    raise exception using errcode = '42501', message = 'HEAD_REQUIRED';
  end if;

  next_code := public.generate_family_code();
  update public.families
  set family_code = next_code
  where id = p_family_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'FAMILY_NOT_FOUND';
  end if;

  return next_code;
end;
$$;

create or replace function public.remove_family_member(
  p_family_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_role text;
begin
  if actor_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;
  if not public.is_family_head(p_family_id) then
    raise exception using errcode = '42501', message = 'HEAD_REQUIRED';
  end if;
  if p_user_id = actor_id then
    raise exception using errcode = '42501', message = 'HEAD_CANNOT_REMOVE_SELF';
  end if;

  select role into target_role
  from public.family_members
  where family_id = p_family_id and user_id = p_user_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'MEMBER_NOT_FOUND';
  end if;
  if target_role = 'head' then
    raise exception using errcode = '42501', message = 'HEAD_CANNOT_REMOVE_SELF';
  end if;

  -- Remove future routine assignments while keeping historical submissions intact.
  if to_regclass('public.routine_assignments') is not null then
    execute 'delete from public.routine_assignments where family_id = $1 and member_id = $2'
      using p_family_id, p_user_id;
  end if;

  delete from public.family_members
  where family_id = p_family_id and user_id = p_user_id;
end;
$$;

create or replace function public.transfer_family_head(
  p_family_id uuid,
  p_new_head_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_role text;
begin
  if actor_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;
  if not public.is_family_head(p_family_id) then
    raise exception using errcode = '42501', message = 'HEAD_REQUIRED';
  end if;
  if p_new_head_user_id = actor_id then
    raise exception using errcode = '22023', message = 'TARGET_NOT_MEMBER';
  end if;

  select role into target_role
  from public.family_members
  where family_id = p_family_id and user_id = p_new_head_user_id
  for update;

  if not found or target_role <> 'member' then
    raise exception using errcode = 'P0002', message = 'TARGET_NOT_MEMBER';
  end if;

  -- Two statements are intentional. If the second update fails the transaction rolls back,
  -- so the room never commits without a Head.
  update public.family_members
  set role = 'member'
  where family_id = p_family_id and user_id = actor_id and role = 'head';

  update public.family_members
  set role = 'head'
  where family_id = p_family_id and user_id = p_new_head_user_id and role = 'member';

  if not found then
    raise exception using errcode = 'P0002', message = 'TARGET_NOT_MEMBER';
  end if;
end;
$$;

create or replace function public.leave_family(
  p_family_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_role text;
begin
  if actor_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  select role into actor_role
  from public.family_members
  where family_id = p_family_id and user_id = actor_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'MEMBER_NOT_FOUND';
  end if;
  if actor_role = 'head' then
    raise exception using errcode = '42501', message = 'HEAD_MUST_TRANSFER';
  end if;

  if to_regclass('public.routine_assignments') is not null then
    execute 'delete from public.routine_assignments where family_id = $1 and member_id = $2'
      using p_family_id, actor_id;
  end if;

  delete from public.family_members
  where family_id = p_family_id and user_id = actor_id;
end;
$$;

-- Family metadata writes are RPC-only from this milestone onward.
revoke update on public.families from authenticated;

grant select on public.families to authenticated;

revoke all on function public.update_family_name(uuid, text) from public;
revoke all on function public.regenerate_family_code(uuid) from public;
revoke all on function public.remove_family_member(uuid, uuid) from public;
revoke all on function public.transfer_family_head(uuid, uuid) from public;
revoke all on function public.leave_family(uuid) from public;

grant execute on function public.update_family_name(uuid, text) to authenticated;
grant execute on function public.regenerate_family_code(uuid) to authenticated;
grant execute on function public.remove_family_member(uuid, uuid) to authenticated;
grant execute on function public.transfer_family_head(uuid, uuid) to authenticated;
grant execute on function public.leave_family(uuid) to authenticated;
