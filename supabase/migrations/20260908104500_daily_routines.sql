-- DiaryQu Daily Routines
-- Run after 20260906144300_family_foundation.sql.

create table if not exists public.routine_definitions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 2 and 120),
  description text check (description is null or char_length(description) <= 1000),
  schedule_type text not null default 'daily' check (schedule_type in ('daily', 'weekly')),
  weekdays smallint[] not null default '{}',
  start_date date not null default current_date,
  end_date date,
  reward_points integer not null default 0 check (reward_points between 0 and 100000),
  proof_required boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint routine_date_range_check check (end_date is null or end_date >= start_date),
  constraint routine_weekday_values_check check (
    weekdays <@ array[0,1,2,3,4,5,6]::smallint[]
  ),
  constraint routine_schedule_days_check check (
    schedule_type = 'daily' or cardinality(weekdays) > 0
  )
);

create table if not exists public.routine_assignments (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routine_definitions(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint routine_assignment_unique unique (routine_id, member_id)
);

create table if not exists public.routine_submissions (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routine_definitions(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  occurrence_date date not null,
  proof_path text,
  proof_mime text check (proof_mime is null or proof_mime in ('image/jpeg', 'image/png', 'image/webp')),
  proof_note text check (proof_note is null or char_length(proof_note) <= 500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text check (review_note is null or char_length(review_note) <= 500),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint routine_submission_unique unique (routine_id, member_id, occurrence_date),
  constraint routine_review_consistency check (
    (status = 'pending' and reviewed_by is null and reviewed_at is null)
    or
    (status in ('approved', 'rejected') and reviewed_by is not null and reviewed_at is not null)
  )
);

create index if not exists routine_definitions_family_active_idx
  on public.routine_definitions(family_id, is_active, start_date);
create index if not exists routine_assignments_family_member_idx
  on public.routine_assignments(family_id, member_id);
create index if not exists routine_submissions_family_date_idx
  on public.routine_submissions(family_id, occurrence_date, status);
create index if not exists routine_submissions_member_date_idx
  on public.routine_submissions(member_id, occurrence_date);

drop trigger if exists routine_definitions_set_updated_at on public.routine_definitions;
create trigger routine_definitions_set_updated_at
before update on public.routine_definitions
for each row execute function public.set_updated_at();

drop trigger if exists routine_submissions_set_updated_at on public.routine_submissions;
create trigger routine_submissions_set_updated_at
before update on public.routine_submissions
for each row execute function public.set_updated_at();

create or replace function public.routine_occurs_on(target_routine_id uuid, target_date date)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.routine_definitions as routine
    where routine.id = target_routine_id
      and routine.is_active
      and target_date >= routine.start_date
      and (routine.end_date is null or target_date <= routine.end_date)
      and (
        routine.schedule_type = 'daily'
        or extract(dow from target_date)::smallint = any(routine.weekdays)
      )
  );
$$;

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
  normalized_weekdays smallint[] := coalesce(p_weekdays, '{}');
begin
  if actor_id is null or not public.is_family_head(p_family_id) then
    raise exception using errcode = '42501', message = 'HEAD_REQUIRED';
  end if;
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
  if coalesce(cardinality(p_assignee_ids), 0) = 0 then
    raise exception using errcode = '22023', message = 'ROUTINE_ASSIGNEE_REQUIRED';
  end if;
  if exists (
    select 1
    from unnest(p_assignee_ids) as assignee_id
    where not exists (
      select 1 from public.family_members
      where family_id = p_family_id and user_id = assignee_id
    )
  ) then
    raise exception using errcode = '42501', message = 'ASSIGNEE_OUTSIDE_FAMILY';
  end if;

  if p_routine_id is null then
    insert into public.routine_definitions (
      family_id, created_by, title, description, schedule_type, weekdays,
      start_date, end_date, reward_points, proof_required, is_active
    ) values (
      p_family_id, actor_id, trim(p_title), nullif(trim(coalesce(p_description, '')), ''),
      p_schedule_type, normalized_weekdays, p_start_date, p_end_date,
      p_reward_points, coalesce(p_proof_required, true), coalesce(p_is_active, true)
    ) returning id into target_id;
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
    where id = p_routine_id and family_id = p_family_id
    returning id into target_id;

    if target_id is null then
      raise exception using errcode = 'P0002', message = 'ROUTINE_NOT_FOUND';
    end if;
  end if;

  delete from public.routine_assignments where routine_id = target_id;
  insert into public.routine_assignments (routine_id, family_id, member_id, assigned_by)
  select target_id, p_family_id, assignee_id, actor_id
  from (select distinct unnest(p_assignee_ids) as assignee_id) as assignees;

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
begin
  select family_id into target_family_id
  from public.routine_definitions
  where id = p_routine_id;

  if target_family_id is null then
    raise exception using errcode = 'P0002', message = 'ROUTINE_NOT_FOUND';
  end if;
  if actor_id is null or not public.is_family_head(target_family_id) then
    raise exception using errcode = '42501', message = 'HEAD_REQUIRED';
  end if;

  delete from public.routine_definitions where id = p_routine_id;
end;
$$;

create or replace function public.submit_routine_completion(
  p_routine_id uuid,
  p_occurrence_date date,
  p_proof_path text,
  p_proof_mime text,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_routine public.routine_definitions%rowtype;
  existing_status text;
  submission_id uuid;
begin
  if actor_id is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  select * into target_routine
  from public.routine_definitions
  where id = p_routine_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'ROUTINE_NOT_FOUND';
  end if;

  if not exists (
    select 1 from public.routine_assignments
    where routine_id = p_routine_id and member_id = actor_id
  ) then
    raise exception using errcode = '42501', message = 'ROUTINE_NOT_ASSIGNED';
  end if;
  if p_occurrence_date is null or p_occurrence_date > current_date then
    raise exception using errcode = '22023', message = 'ROUTINE_FUTURE_SUBMISSION';
  end if;
  if not public.routine_occurs_on(p_routine_id, p_occurrence_date) then
    raise exception using errcode = '22023', message = 'ROUTINE_NOT_SCHEDULED_FOR_DATE';
  end if;
  if target_routine.proof_required and nullif(trim(coalesce(p_proof_path, '')), '') is null then
    raise exception using errcode = '22023', message = 'ROUTINE_PROOF_REQUIRED';
  end if;
  if p_proof_mime is not null and p_proof_mime not in ('image/jpeg', 'image/png', 'image/webp') then
    raise exception using errcode = '22023', message = 'INVALID_PROOF_MIME';
  end if;

  select status into existing_status
  from public.routine_submissions
  where routine_id = p_routine_id
    and member_id = actor_id
    and occurrence_date = p_occurrence_date;
  if existing_status = 'approved' then
    raise exception using errcode = '22023', message = 'ROUTINE_ALREADY_APPROVED';
  end if;

  insert into public.routine_submissions (
    routine_id, family_id, member_id, occurrence_date, proof_path, proof_mime,
    proof_note, status, submitted_at, reviewed_by, reviewed_at, review_note
  ) values (
    p_routine_id, target_routine.family_id, actor_id, p_occurrence_date,
    nullif(trim(coalesce(p_proof_path, '')), ''), p_proof_mime,
    nullif(trim(coalesce(p_note, '')), ''), 'pending', now(), null, null, null
  )
  on conflict (routine_id, member_id, occurrence_date)
  do update set
    proof_path = excluded.proof_path,
    proof_mime = excluded.proof_mime,
    proof_note = excluded.proof_note,
    status = 'pending',
    submitted_at = now(),
    reviewed_by = null,
    reviewed_at = null,
    review_note = null
  returning id into submission_id;

  return submission_id;
end;
$$;

create or replace function public.review_routine_submission(
  p_submission_id uuid,
  p_decision text,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  target_submission public.routine_submissions%rowtype;
begin
  select * into target_submission
  from public.routine_submissions
  where id = p_submission_id;
  if not found then
    raise exception using errcode = 'P0002', message = 'ROUTINE_SUBMISSION_NOT_FOUND';
  end if;
  if actor_id is null or not public.is_family_head(target_submission.family_id) then
    raise exception using errcode = '42501', message = 'HEAD_REQUIRED';
  end if;
  if actor_id = target_submission.member_id then
    raise exception using errcode = '42501', message = 'SELF_APPROVAL_NOT_ALLOWED';
  end if;
  if target_submission.status <> 'pending' then
    raise exception using errcode = '22023', message = 'ROUTINE_SUBMISSION_ALREADY_REVIEWED';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception using errcode = '22023', message = 'INVALID_REVIEW_DECISION';
  end if;
  if p_decision = 'rejected' and nullif(trim(coalesce(p_note, '')), '') is null then
    raise exception using errcode = '22023', message = 'REJECTION_NOTE_REQUIRED';
  end if;

  update public.routine_submissions
  set status = p_decision,
      review_note = nullif(trim(coalesce(p_note, '')), ''),
      reviewed_by = actor_id,
      reviewed_at = now()
  where id = p_submission_id;

  return p_submission_id;
end;
$$;

alter table public.routine_definitions enable row level security;
alter table public.routine_assignments enable row level security;
alter table public.routine_submissions enable row level security;

drop policy if exists routine_definitions_select_family on public.routine_definitions;
create policy routine_definitions_select_family
on public.routine_definitions for select to authenticated
using (public.is_family_member(family_id));

drop policy if exists routine_assignments_select_family on public.routine_assignments;
create policy routine_assignments_select_family
on public.routine_assignments for select to authenticated
using (public.is_family_member(family_id));

-- A member can see only their own proof/submission history; family heads can review all.
drop policy if exists routine_submissions_select_family on public.routine_submissions;
create policy routine_submissions_select_family
on public.routine_submissions for select to authenticated
using (
  member_id = auth.uid()
  or public.is_family_head(family_id)
);

revoke all on public.routine_definitions from anon, authenticated;
revoke all on public.routine_assignments from anon, authenticated;
revoke all on public.routine_submissions from anon, authenticated;
grant select on public.routine_definitions to authenticated;
grant select on public.routine_assignments to authenticated;
grant select on public.routine_submissions to authenticated;

revoke all on function public.routine_occurs_on(uuid, date) from public;
revoke all on function public.save_family_routine(uuid, uuid, text, text, text, smallint[], date, date, integer, boolean, boolean, uuid[]) from public;
revoke all on function public.delete_family_routine(uuid) from public;
revoke all on function public.submit_routine_completion(uuid, date, text, text, text) from public;
revoke all on function public.review_routine_submission(uuid, text, text) from public;
grant execute on function public.save_family_routine(uuid, uuid, text, text, text, smallint[], date, date, integer, boolean, boolean, uuid[]) to authenticated;
grant execute on function public.delete_family_routine(uuid) to authenticated;
grant execute on function public.submit_routine_completion(uuid, date, text, text, text) to authenticated;
grant execute on function public.review_routine_submission(uuid, text, text) to authenticated;

-- Private proof bucket. Members can access only their own proof files; heads can review family proofs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'routine-proofs',
  'routine-proofs',
  false,
  6000000,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = 6000000,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists routine_proofs_select_family on storage.objects;
create policy routine_proofs_select_family
on storage.objects for select to authenticated
using (
  bucket_id = 'routine-proofs'
  and (
    (
      split_part(name, '/', 2) = auth.uid()::text
      and exists (
        select 1 from public.family_members
        where family_id::text = split_part(name, '/', 1)
          and user_id = auth.uid()
      )
    )
    or exists (
      select 1 from public.family_members
      where family_id::text = split_part(name, '/', 1)
        and user_id = auth.uid()
        and role = 'head'
    )
  )
);

drop policy if exists routine_proofs_insert_own on storage.objects;
create policy routine_proofs_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id = 'routine-proofs'
  and split_part(name, '/', 2) = auth.uid()::text
  and exists (
    select 1 from public.family_members
    where family_id::text = split_part(name, '/', 1)
      and user_id = auth.uid()
  )
);

drop policy if exists routine_proofs_update_own on storage.objects;
create policy routine_proofs_update_own
on storage.objects for update to authenticated
using (
  bucket_id = 'routine-proofs'
  and split_part(name, '/', 2) = auth.uid()::text
  and exists (
    select 1 from public.family_members
    where family_id::text = split_part(name, '/', 1)
      and user_id = auth.uid()
  )
)
with check (
  bucket_id = 'routine-proofs'
  and split_part(name, '/', 2) = auth.uid()::text
  and exists (
    select 1 from public.family_members
    where family_id::text = split_part(name, '/', 1)
      and user_id = auth.uid()
  )
);

drop policy if exists routine_proofs_delete_owner_or_head on storage.objects;
create policy routine_proofs_delete_owner_or_head
on storage.objects for delete to authenticated
using (
  bucket_id = 'routine-proofs'
  and (
    (
      split_part(name, '/', 2) = auth.uid()::text
      and exists (
        select 1 from public.family_members
        where family_id::text = split_part(name, '/', 1)
          and user_id = auth.uid()
      )
    )
    or exists (
      select 1 from public.family_members
      where family_id::text = split_part(name, '/', 1)
        and user_id = auth.uid()
        and role = 'head'
    )
  )
);

-- Realtime refresh for family routine changes.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'routine_definitions'
  ) then
    alter publication supabase_realtime add table public.routine_definitions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'routine_assignments'
  ) then
    alter publication supabase_realtime add table public.routine_assignments;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'routine_submissions'
  ) then
    alter publication supabase_realtime add table public.routine_submissions;
  end if;
end
$$;
