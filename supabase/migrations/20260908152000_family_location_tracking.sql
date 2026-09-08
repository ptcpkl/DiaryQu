-- DiaryQu Family Location Tracking
-- Run after 20260906144300_family_foundation.sql.
-- Privacy model: latest foreground location only, no history/background tracking.

create table if not exists public.family_member_locations (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  latitude double precision,
  longitude double precision,
  accuracy_meters double precision,
  provider text check (provider is null or char_length(provider) <= 40),
  sharing_enabled boolean not null default false,
  recorded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (family_id, user_id),
  constraint family_member_locations_membership_fk
    foreign key (family_id, user_id)
    references public.family_members(family_id, user_id)
    on delete cascade,
  constraint family_member_locations_coordinate_pair_check check (
    (latitude is null and longitude is null)
    or (latitude is not null and longitude is not null)
  ),
  constraint family_member_locations_latitude_check check (
    latitude is null or latitude between -90 and 90
  ),
  constraint family_member_locations_longitude_check check (
    longitude is null or longitude between -180 and 180
  ),
  constraint family_member_locations_accuracy_check check (
    accuracy_meters is null or accuracy_meters between 0 and 100000
  ),
  constraint family_member_locations_sharing_payload_check check (
    sharing_enabled = false
    or (latitude is not null and longitude is not null and recorded_at is not null)
  )
);

create index if not exists family_member_locations_family_updated_idx
  on public.family_member_locations(family_id, updated_at desc);

create or replace function public.protect_family_member_location_ownership()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.family_id <> old.family_id
     or new.user_id <> old.user_id
     or new.created_at <> old.created_at then
    raise exception using errcode = '42501', message = 'TRACKING_OWNERSHIP_IMMUTABLE';
  end if;
  return new;
end;
$$;

drop trigger if exists family_member_locations_set_updated_at
  on public.family_member_locations;
create trigger family_member_locations_set_updated_at
before update on public.family_member_locations
for each row execute function public.set_updated_at();

drop trigger if exists family_member_locations_protect_ownership
  on public.family_member_locations;
create trigger family_member_locations_protect_ownership
before update on public.family_member_locations
for each row execute function public.protect_family_member_location_ownership();

alter table public.family_member_locations enable row level security;

drop policy if exists family_member_locations_select_visible
  on public.family_member_locations;
create policy family_member_locations_select_visible
on public.family_member_locations
for select
to authenticated
using (
  user_id = auth.uid()
  or (
    sharing_enabled = true
    and public.is_family_member(family_id)
  )
);

drop policy if exists family_member_locations_insert_self
  on public.family_member_locations;
create policy family_member_locations_insert_self
on public.family_member_locations
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_family_member(family_id)
);

drop policy if exists family_member_locations_update_self
  on public.family_member_locations;
create policy family_member_locations_update_self
on public.family_member_locations
for update
to authenticated
using (
  user_id = auth.uid()
  and public.is_family_member(family_id)
)
with check (
  user_id = auth.uid()
  and public.is_family_member(family_id)
);

drop policy if exists family_member_locations_delete_self
  on public.family_member_locations;
create policy family_member_locations_delete_self
on public.family_member_locations
for delete
to authenticated
using (
  user_id = auth.uid()
  and public.is_family_member(family_id)
);

revoke all on public.family_member_locations from anon, authenticated;
grant select, insert, update, delete on public.family_member_locations to authenticated;
revoke all on function public.protect_family_member_location_ownership() from public;

-- Only the latest location row is synchronized. No tracking history table is published.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'family_member_locations'
  ) then
    alter publication supabase_realtime add table public.family_member_locations;
  end if;
end
$$;
