# DiaryQu Implementation Status

This file tracks feature delivery against the DiaryQu PRD.

## Completed

- React Native application shell and Android development flow
- React Navigation root flow and bottom tabs
- Zustand authentication state and frontend demo-login mode
- Supabase client and auth integration
- Family Room schema, RLS helpers, create/join RPC contracts, and family setup gate
- Profile and static Contribution screens
- Global DiaryQu design system and reusable UI primitives
- Home Dashboard frontend milestone
- Agenda CRUD and demo repository
- Agenda categories: Work, Business, Islamic
- Agenda Android local reminder, snooze 5 minutes, dismiss, and reboot rescheduling
- Agenda calendar/list/create/edit/delete UI polish
- Agenda editor validation and automated tests
- Daily Routines recurring schedules, member assignment, rewards, active state, and daily progress
- Daily Routines proof submission with Android system photo picker
- Daily Routines private proof storage, family-scoped access policies, and signed proof URLs
- Daily Routines pending/approved/rejected review flow with self-approval protection
- Daily Routines realtime family refresh and automated schedule tests
- UangQu transaction persistence with income/expense, category, note, date, and immutable family ownership
- UangQu lifetime balance, current-month statistics, current-year statistics, and grouped daily history
- UangQu head-only write permissions with family-member read visibility enforced by RLS
- UangQu realtime family synchronization, frontend demo repository, editor validation, and automated finance calculations

## Current milestone

- Stage 6: UangQu / Finance implementation complete in code
- Database migration `20260908114000_uangqu_finance.sql` must be applied manually to the target Supabase project before production mode uses UangQu
- Historical transactions are never destructively reset: lifetime balance uses all transactions, while monthly/yearly statistics are derived from the relevant date periods
- AssetQu remains a separate domain and is intentionally scheduled for the next milestone

## Next milestones

- AssetQu CRUD, categories, timestamps, persistence, and UI
- Family location tracking
- Remaining Profile/Family settings polish
- Ads integration and release hardening
- Play Store release preparation
