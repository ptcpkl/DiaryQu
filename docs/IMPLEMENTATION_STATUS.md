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
- Android Google Mobile Ads SDK integration with a reusable React Native banner view
- Beranda ad placeholder replaced by a real banner placement using official Google test inventory in debug builds
- Release ads are fail-closed until production enable flag and non-sample AdMob IDs are supplied
- DiaryQu ad requests are non-personalized, capped to G-rated content, and do not add first-party Family Room/profile/location/finance data
- Automated ads configuration tests plus existing TypeScript, ESLint, Jest, and Android Kotlin compile coverage

## Current milestone

- Stage 10: Ads / Monetization integration complete in code
- Debug builds use official Google test ads only
- Release monetization remains disabled by default until `DIARYQU_ADS_PRODUCTION_ENABLED=true` and real AdMob App/Banner IDs are supplied
- There is one banner placement on Beranda; no interstitial, app-open, rewarded, or forced full-screen ad formats are enabled
- Production rollout checklist is documented in `docs/ADS_MONETIZATION.md`

## Next milestones

- Stage 11: Cross-feature hardening, visual polish, accessibility, reliability, and release-readiness pass
- Play Store release preparation / final release checklist
