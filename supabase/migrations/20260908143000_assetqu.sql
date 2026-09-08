-- DiaryQu AssetQu
-- Run after 20260906144300_family_foundation.sql.

create table if not exists public.family_assets (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  category text not null check (category in ('savings', 'gold', 'land', 'garden', 'debt')),
  name text not null check (char_length(trim(name)) between 2 and 120),
  estimated_value bigint not null check (estimated_value > 0 and estimated_value <= 9000000000000),
  quantity numeric check (quantity is null or quantity > 0),
  unit text check (unit is null or char_length(unit) <= 30),
  note text check (note is null or char_length(note) <= 500),
  acquired_on date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists family_assets_family_category_active_idx
  on public.family_assets(family_id, category, is_active desc, updated_at desc);

create or replace function public.protect_family_asset_ownership()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.family_id <> old.family_id
     or new.created_by <> old.created_by
     or new.created_at <> old.created_at then
    raise exception using errcode = '42501', message = 'ASSET_OWNERSHIP_IMMUTABLE';
  end if;
  return new;
end;
$$;

drop trigger if exists family_assets_set_updated_at on public.family_assets;
create trigger family_assets_set_updated_at
before update on public.family_assets
for each row execute function public.set_updated_at();

drop trigger if exists family_assets_protect_ownership on public.family_assets;
create trigger family_assets_protect_ownership
before update on public.family_assets
for each row execute function public.protect_family_asset_ownership();

alter table public.family_assets enable row level security;

drop policy if exists family_assets_select_family on public.family_assets;
create policy family_assets_select_family
on public.family_assets
for select
to authenticated
using (public.is_family_member(family_id));

drop policy if exists family_assets_insert_head on public.family_assets;
create policy family_assets_insert_head
on public.family_assets
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.is_family_head(family_id)
);

drop policy if exists family_assets_update_head on public.family_assets;
create policy family_assets_update_head
on public.family_assets
for update
to authenticated
using (public.is_family_head(family_id))
with check (public.is_family_head(family_id));

drop policy if exists family_assets_delete_head on public.family_assets;
create policy family_assets_delete_head
on public.family_assets
for delete
to authenticated
using (public.is_family_head(family_id));

revoke all on public.family_assets from anon, authenticated;
grant select, insert, update, delete on public.family_assets to authenticated;
revoke all on function public.protect_family_asset_ownership() from public;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'family_assets'
  ) then
    alter publication supabase_realtime add table public.family_assets;
  end if;
end
$$;
