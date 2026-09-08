-- DiaryQu UangQu / Finance
-- Run after 20260906144300_family_foundation.sql.

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  transaction_type text not null check (transaction_type in ('income', 'expense')),
  amount bigint not null check (amount > 0 and amount <= 9000000000000),
  category text not null check (char_length(trim(category)) between 2 and 60),
  note text check (note is null or char_length(note) <= 500),
  occurred_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists financial_transactions_family_date_idx
  on public.financial_transactions(family_id, occurred_on desc, created_at desc);
create index if not exists financial_transactions_family_type_date_idx
  on public.financial_transactions(family_id, transaction_type, occurred_on desc);

create or replace function public.protect_financial_transaction_ownership()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.family_id <> old.family_id
     or new.created_by <> old.created_by
     or new.created_at <> old.created_at then
    raise exception using errcode = '42501', message = 'FINANCE_OWNERSHIP_IMMUTABLE';
  end if;
  return new;
end;
$$;

drop trigger if exists financial_transactions_set_updated_at on public.financial_transactions;
create trigger financial_transactions_set_updated_at
before update on public.financial_transactions
for each row execute function public.set_updated_at();

drop trigger if exists financial_transactions_protect_ownership on public.financial_transactions;
create trigger financial_transactions_protect_ownership
before update on public.financial_transactions
for each row execute function public.protect_financial_transaction_ownership();

alter table public.financial_transactions enable row level security;

drop policy if exists financial_transactions_select_family on public.financial_transactions;
create policy financial_transactions_select_family
on public.financial_transactions
for select
to authenticated
using (public.is_family_member(family_id));

drop policy if exists financial_transactions_insert_head on public.financial_transactions;
create policy financial_transactions_insert_head
on public.financial_transactions
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.is_family_head(family_id)
  and occurred_on <= current_date
);

drop policy if exists financial_transactions_update_head on public.financial_transactions;
create policy financial_transactions_update_head
on public.financial_transactions
for update
to authenticated
using (public.is_family_head(family_id))
with check (
  public.is_family_head(family_id)
  and occurred_on <= current_date
);

drop policy if exists financial_transactions_delete_head on public.financial_transactions;
create policy financial_transactions_delete_head
on public.financial_transactions
for delete
to authenticated
using (public.is_family_head(family_id));

revoke all on public.financial_transactions from anon, authenticated;
grant select, insert, update, delete on public.financial_transactions to authenticated;

revoke all on function public.protect_financial_transaction_ownership() from public;

-- Finance benefits from family synchronization, but only this table is published.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'financial_transactions'
  ) then
    alter publication supabase_realtime add table public.financial_transactions;
  end if;
end
$$;
