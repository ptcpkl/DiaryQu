-- DiaryQu Agenda categories
-- Run after 20260906152500_agenda.sql.

alter table public.agenda_entries
  add column if not exists category text;

update public.agenda_entries
set category = 'work'
where category is null;

alter table public.agenda_entries
  alter column category set default 'work',
  alter column category set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'agenda_entries_category_check'
      and conrelid = 'public.agenda_entries'::regclass
  ) then
    alter table public.agenda_entries
      add constraint agenda_entries_category_check
      check (category in ('work', 'business', 'islamic'));
  end if;
end
$$;

create index if not exists agenda_entries_family_category_starts_idx
  on public.agenda_entries(family_id, category, starts_at);
