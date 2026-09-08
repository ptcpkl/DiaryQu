# Ads Integration Validation

Use this checklist when validating Stage 10 locally and before a release candidate.

## Debug / emulator

- Home renders one banner slot only.
- The wrapper shows `IKLAN` and `TEST MODE`.
- Google test creative loads; never use a live ad unit while clicking/testing.
- If the device is offline or the ad request fails, the rest of Home remains usable.
- Agenda, Tracking, Routines, Finance, Profile, and Family Room navigation remain unaffected.

## Release gate

- `DIARYQU_ADS_PRODUCTION_ENABLED` is false by default.
- A release build with no real IDs must not load ads.
- Production can only be enabled after a real AdMob App ID and Banner Unit ID are supplied.
- Sample IDs must never enable release monetization.
- Consent/privacy declarations must be finalized before the production flag is switched on.

## Product rules

- Keep ads out of task completion, finance actions, Family Code flows, location consent, and other sensitive interactions.
- Do not add full-screen or disruptive formats without a separate product review.
- Do not pass DiaryQu first-party family/profile/location/finance data into ad requests.
