# DiaryQu Implementation Status

This file tracks feature delivery against the DiaryQu PRD and current product decisions.

## Completed

- React Native application shell and Android development flow
- React Navigation root flow and bottom tabs
- Zustand authentication state and frontend demo-login mode
- Supabase client and auth integration
- Family Room schema, RLS helpers, create/join RPC contracts, and family setup gate
- Profile and static Contribution screens
- Global DiaryQu design system and reusable UI primitives
- Home Dashboard frontend milestone
- Agenda CRUD, categories, Android reminders, calendar/list/editor UI, and tests
- Daily Routines recurring schedules, member assignment, rewards, proof workflow, approval/rejection, private storage, realtime refresh, and tests
- UangQu family-scoped income/expense transactions, cumulative balance, monthly/yearly summaries, grouped history, CRUD, realtime refresh, RLS, demo data, and tests
- Finance dashboard columns: Pemasukan, Pengeluaran, and List Tagihan. The former Budget slot is intentionally replaced by List Tagihan.
- List Tagihan recurring monthly bill definitions with amount, due day, active/archive state, family visibility, head-only management, realtime refresh, RLS, demo data, and tests
- AssetQu categories: Tabungan, Emas, Tanah, Kebun, and Hutang
- AssetQu CRUD, estimated current value, optional quantity/unit, notes, acquired date, active/archive state, family visibility, realtime refresh, RLS, demo data, net-worth calculation, and tests

## Current milestone

- Stage 7: AssetQu implementation complete in code
- Database migrations must be applied manually to the target Supabase project before production mode uses the new Finance additions:
  - `20260908135500_finance_bills.sql`
  - `20260908143000_assetqu.sql`
- UangQu lifetime balance remains non-destructive: month/year cards are computed views over transaction history and do not reset stored records.
- AssetQu treats Hutang as a liability: net worth = active non-debt assets - active debt.

## Next milestones

- Family location tracking
- Remaining Profile/Family settings polish
- Ads integration and release hardening
- Play Store release preparation
