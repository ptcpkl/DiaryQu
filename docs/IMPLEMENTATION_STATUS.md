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
- Family Location Tracking UI with family member selector, relative map preview, location freshness, selected-member detail, OpenStreetMap handoff, loading/error/empty states, and demo data
- Consent-first foreground Android location bridge using coarse/fine permission only when the user explicitly presses share/update
- Family location persistence stores latest position only, clears coordinates when sharing stops, protects rows with family-scoped RLS, and synchronizes visible changes with Supabase Realtime
- Automated tracking helper tests and Android Kotlin compile coverage

## Current milestone

- Stage 8: Family Location Tracking implementation complete in code
- Database migration `20260908152000_family_location_tracking.sql` must be applied manually before production mode uses tracking
- Tracking is intentionally privacy-first: no background permission, no continuous broadcast, and no location-history table
- Family members only see rows whose owner has `sharing_enabled = true`; each user can only write or clear their own location row

## Next milestones

- Remaining Profile/Family settings polish
- Ads integration and release hardening
- Play Store release preparation
