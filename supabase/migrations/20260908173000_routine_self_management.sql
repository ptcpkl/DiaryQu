-- DiaryQu final hardening: member-owned routines
-- Run after 20260908104500_daily_routines.sql.
-- PRD requirement: members may create/manage their own activities and rewards,
-- while a Head may manage routines for any family member.

create or replace function public.save_family_routine(
  p_routine_id uuid,
  p_family_id uuid,
  p_title text,
  p_description text,
  p_schedule_type text,
  p_weekdays smallint[],
  p_start_date date,
  p_end_date date,
  p_reward_points integer,
  p_proof_required boolean,
  p_is_active boolean,
  p_assignee_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_id uuid;
  target_created_by uuid;
  actor_is_head boolean := false;
  normalized_weekdays smallint[] := coalesce(p_weekdays, '{}');
  normalized_assignees uuid[] := coalesce(p_assignee_ids, '{}');
begin
  if actor_id is null or not public.is_family_member(p_family_id) then
    raise exception using errcode = '42501', message = 'FAMILY_MEMBER_REQUIRED';
  end if;

  actor_is_head := public.is_family_head(p_family_id);

  if p_title is null or char_length(trim(p_title)) < 2 then
    raise exception using errcode = '22023', message = 'INVALID_ROUTINE_TITLE';
  end if;
  if p_schedule_type not in ('daily', 'weekly') then
    raise exception using errcode = '22023', message = 'INVALID_ROUTINE_SCHEDULE';
  end if;
  if p_schedule_type = 'weekly' and cardinality(normalized_weekdays) = 0 then
    raise exception using errcode = '22023', message = 'ROUTINE_WEEKDAYS_REQUIRED';
  end if;
  if p_start_date is null or (p_end_date is not null and p_end_date < p_start_date) then
    raise exception using errcode = '22023', message = 'INVALID_ROUTINE_DATE_RANGE';
  end if;
  if p_reward_points is null or p_reward_points < 0 or p_reward_points > 100000 then
    raise exception using errcode = '22023', message = 'INVALID_ROUTINE_REWARD';
  end if;
  if cardinality(normalized_assignees) = 0 then
    raise exception using errcode = '22023', message = 'ROUTINE_ASSIGNEE_REQUIRED';
  end if;

  if exists (
    select 1
    from unnest(normalized_assignees) as assignee_id
    where not exists (
      select 1
      from public.family_members
      where family_id = p_family_id and user_id = assignee_id
    )
  ) then
    raise exception using errcode = '42501', message = 'ASSIGNEE_OUTSIDE_FAMILY';
  end if;

  -- Members may only create/update routines assigned to themselves.
  if not actor_is_head then
    if cardinality(normalized_assignees) <> 1 or normalized_assignees[1] <> actor_id then
      raise exception using errcode = '42501', message = 'MEMBER_SELF_ASSIGNMENT_REQUIRED';
    end if;

    if p_routine_id is not null then
      select created_by
      into target_created_by
      from public.routine_definitions
      where id = p_routine_id and family_id = p_family_id;

      if target_created_by is null then
        raise exception using errcode = 'P0002', message = 'ROUTINE_NOT_FOUND';
      end if;
      if target_created_by <> actor_id then
        raise exception using errcode = '42501', message = 'ROUTINE_OWNER_REQUIRED';
      end if;
    end if;
  end if;

  if p_routine_id is null then
    insert into public.routine_definitions (
      family_id,
      created_by,
      title,
      description,
      schedule_type,
      weekdays,
      start_date,
      end_date,
      reward_points,
      proof_required,
      is_active
    ) values (
      p_family_id,
      actor_id,
      trim(p_title),
      nullif(trim(coalesce(p_description, '')), ''),
      p_schedule_type,
      normalized_weekdays,
      p_start_date,
      p_end_date,
      p_reward_points,
      coalesce(p_proof_required, true),
      coalesce(p_is_active, true)
    )
    returning id into target_id;
  else
    update public.routine_definitions
    set title = trim(p_title),
        description = nullif(trim(coalesce(p_description, '')), ''),
        schedule_type = p_schedule_type,
        weekdays = normalized_weekdays,
        start_date = p_start_date,
        end_date = p_end_date,
        reward_points = p_reward_points,
        proof_required = coalesce(p_proof_required, true),
        is_active = coalesce(p_is_active, true)
    where id = p_routine_id
      and family_id = p_family_id
    returning id into target_id;

    if target_id is null then
      raise exception using errcode = 'P0002', message = 'ROUTINE_NOT_FOUND';
    end if;
  end if;

  delete from public.routine_assignments where routine_id = target_id;

  insert into public.routine_assignments (
    routine_id,
    family_id,
    member_id,
    assigned_by
  )
  select target_id, p_family_id, assignee_id, actor_id
  from (
    select distinct unnest(normalized_assignees) as assignee_id
  ) as assignees;

  return target_id;
end;
$$;

create or replace function public.delete_family_routine(p_routine_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_family_id uuid;
  target_created_by uuid;
begin
  select family_id, created_by
  into target_family_id, target_created_by
  from public.routine_definitions
  where id = p_routine_id;

  if target_family_id is null then
    raise exception using errcode = 'P0002', message = 'ROUTINE_NOT_FOUND';
  end if;

  if actor_id is null or not public.is_family_member(target_family_id) then
    raise exception using errcode = '42501', message = 'FAMILY_MEMBER_REQUIRED';
  end if;

  if not public.is_family_head(target_family_id) and target_created_by <> actor_id then
    raise exception using errcode = '42501', message = 'ROUTINE_OWNER_REQUIRED';
  end if;

  delete from public.routine_definitions where id = p_routine_id;
end;
$$;

revoke all on function public.save_family_routine(
  uuid, uuid, text, text, text, smallint[], date, date,
  integer, boolean, boolean, uuid[]
) from public;
revoke all on function public.delete_family_routine(uuid) from public;

grant execute on function public.save_family_routine(
  uuid, uuid, text, text, text, smallint[], date, date,
  integer, boolean, boolean, uuid[]
) to authenticated;
grant execute on function public.delete_family_routine(uuid) to authenticated;
