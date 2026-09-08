# Stage 6 — UangQu / Finance

## Scope

UangQu is the family financial-transaction domain. It is deliberately separate from AssetQu.

Implemented:

- income and expense transactions
- structured category selection with free-text-safe persistence
- optional notes
- transaction occurrence date
- lifetime cumulative balance
- current-month income and expense statistics
- current-year income and expense statistics
- grouped daily transaction history
- all / income / expense filtering
- create, edit, and delete transaction flows for Family Head
- read-only family transparency for Family Members
- frontend demo data for UI development
- Realtime refresh for the family transaction table
- loading, empty, validation, permission, and retry states

## Financial correctness

The database never resets or deletes historical transactions on the first day of a month.

- Lifetime balance = all income minus all expense across all stored transactions.
- Monthly statistics = transactions whose occurrence date is in the current calendar month.
- Yearly statistics = transactions whose occurrence date is in the current calendar year.

This keeps historical balance consistent while allowing period statistics to start from zero naturally when the calendar period changes.

## Security

`financial_transactions` is family-scoped.

- Family members can read transactions belonging to their Family Room.
- Only a Family Head can insert, update, or delete transactions.
- New rows must use the authenticated Head as `created_by`.
- `family_id`, `created_by`, and `created_at` are immutable after creation.
- Future occurrence dates are rejected by both UI validation and database policy.
- RLS is the authority; the React Native UI only reflects the permission model.

## Migration

Apply manually after the Family foundation migration:

`supabase/migrations/20260908114000_uangqu_finance.sql`

## AssetQu boundary

The UangQu / AssetQu toggle is already visible. AssetQu remains a separate data model because asset records are not cashflow transactions. Full AssetQu CRUD is Stage 7.
