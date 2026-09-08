# DiaryQu Implementation Status

This file tracks feature delivery against the DiaryQu PRD and current product decisions.

## Completed

- React Native application shell and Android development flow
- React Navigation root flow and bottom tabs
- Zustand authentication state and frontend demo-login mode
- Supabase client and auth integration
- Family Room schema, RLS helpers, create/join RPC contracts, and family setup gate
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
- Profile dashboard with large identity header, current shared-location summary, family-member location shortcuts, settings navigation, logout, and static contribution banner
- Account Settings for authenticated user profile name and phone number with self-only profile persistence and auth display-name synchronization
- Family Room settings with member list, Family Code sharing/regeneration, family rename, secure Head transfer, Head-only member removal, and Member leave-room flow
- Family role mutations are RPC-only and enforce one Head per Family Room; client state cannot self-promote to Head
- Automated profile/family helper tests plus existing TypeScript, ESLint, Jest, and Android Kotlin compile coverage

## Current milestone

- Stage 9: Profile + Family Room / Settings polish complete in code
- Database migration `20260908164000_profile_family_settings.sql` must be applied manually before production mode uses Family Room management actions
- Profile edits reuse the existing `profiles` table from Family Foundation; no new profile table is introduced
- Family metadata changes are RPC-only from Stage 9 onward, and direct authenticated updates to `families` are revoked

## Next milestones

- Ads integration and monetization shell
- Cross-feature hardening, visual polish, and accessibility pass
- Play Store release preparation
