-- DiaryQu Finance - List Tagihan
-- Run after 20260908114000_uangqu_finance.sql.

create table if not exists public.financial_bills (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 2 and 120),
  amount bigint not null check (amount > 0 and amount <= 9000000000000),
  due_day smallint not null check (due_day between 1 and 31),
  note text check (note is null or char_length(note) <= 500),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists financial_bills_family_active_due_idx
  on public.financial_bills(family_id, is_active desc, due_day asc);

create or replace function public.protect_financial_bill_ownership()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.family_id <> old.family_id
     or new.created_by <> old.created_by
     or new.created_at <> old.created_at then
    raise exception using errcode = '42501', message = 'FINANCE_BILL_OWNERSHIP_IMMUTABLE';
  end if;
  return new;
end;
$$;

drop trigger if exists financial_bills_set_updated_at on public.financial_bills;
create trigger financial_bills_set_updated_at
before update on public.financial_bills
for each row execute function public.set_updated_at();

drop trigger if exists financial_bills_protect_ownership on public.financial_bills;
create trigger financial_bills_protect_ownership
before update on public.financial_bills
for each row execute function public.protect_financial_bill_ownership();

alter table public.financial_bills enable row level security;

drop policy if exists financial_bills_select_family on public.financial_bills;
create policy financial_bills_select_family
on public.financial_bills
for select
to authenticated
using (public.is_family_member(family_id));

drop policy if exists financial_bills_insert_head on public.financial_bills;
create policy financial_bills_insert_head
on public.financial_bills
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.is_family_head(family_id)
);

drop policy if exists financial_bills_update_head on public.financial_bills;
create policy financial_bills_update_head
on public.financial_bills
for update
to authenticated
using (public.is_family_head(family_id))
with check (public.is_family_head(family_id));

drop policy if exists financial_bills_delete_head on public.financial_bills;
create policy financial_bills_delete_head
on public.financial_bills
for delete
to authenticated
using (public.is_family_head(family_id));

revoke all on public.financial_bills from anon, authenticated;
grant select, insert, update, delete on public.financial_bills to authenticated;
revoke all on function public.protect_financial_bill_ownership() from public;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'financial_bills'
  ) then
    alter publication supabase_realtime add table public.financial_bills;
  end if;
end
$$;
