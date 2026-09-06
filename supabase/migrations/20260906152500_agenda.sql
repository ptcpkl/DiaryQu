-- DiaryQu Agenda
-- Run after 20260906144300_family_foundation.sql.

create table if not exists public.agenda_entries (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 120),
  notes text check (notes is null or char_length(notes) <= 1000),
  location text check (location is null or char_length(location) <= 240),
  starts_at timestamptz not null,
  reminder_enabled boolean not null default true,
  reminder_at timestamptz,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'postponed', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agenda_reminder_consistency check (
    (reminder_enabled = false and reminder_at is null)
    or
    (reminder_enabled = true and reminder_at is not null and reminder_at <= starts_at)
  )
);

create index if not exists agenda_entries_family_starts_idx
  on public.agenda_entries(family_id, starts_at);
create index if not exists agenda_entries_creator_idx
  on public.agenda_entries(created_by, starts_at);

create or replace function public.protect_agenda_ownership()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.family_id <> old.family_id
     or new.created_by <> old.created_by
     or new.created_at <> old.created_at then
    raise exception using errcode = '42501', message = 'AGENDA_OWNERSHIP_IMMUTABLE';
  end if;
  return new;
end;
$$;

drop trigger if exists agenda_entries_set_updated_at on public.agenda_entries;
create trigger agenda_entries_set_updated_at
before update on public.agenda_entries
for each row execute function public.set_updated_at();

drop trigger if exists agenda_entries_protect_ownership on public.agenda_entries;
create trigger agenda_entries_protect_ownership
before update on public.agenda_entries
for each row execute function public.protect_agenda_ownership();

alter table public.agenda_entries enable row level security;

-- Every family member can see the shared family agenda.
drop policy if exists agenda_select_family_member on public.agenda_entries;
create policy agenda_select_family_member
on public.agenda_entries
for select
to authenticated
using (public.is_family_member(family_id));

-- A member can create agenda items only as themselves inside their own Family Room.
drop policy if exists agenda_insert_family_member on public.agenda_entries;
create policy agenda_insert_family_member
on public.agenda_entries
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.is_family_member(family_id)
);

-- Creator can edit their agenda. Head may help manage agenda inside the room.
drop policy if exists agenda_update_owner_or_head on public.agenda_entries;
create policy agenda_update_owner_or_head
on public.agenda_entries
for update
to authenticated
using (
  public.is_family_member(family_id)
  and (created_by = auth.uid() or public.is_family_head(family_id))
)
with check (
  public.is_family_member(family_id)
  and (created_by = auth.uid() or public.is_family_head(family_id))
);

drop policy if exists agenda_delete_owner_or_head on public.agenda_entries;
create policy agenda_delete_owner_or_head
on public.agenda_entries
for delete
to authenticated
using (
  public.is_family_member(family_id)
  and (created_by = auth.uid() or public.is_family_head(family_id))
);

grant select, insert, update, delete on public.agenda_entries to authenticated;
revoke all on function public.protect_agenda_ownership() from public;
