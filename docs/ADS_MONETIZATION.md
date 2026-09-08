# DiaryQu Ads / Monetization

Stage 10 adds a single, non-intrusive Android banner placement on Beranda.

## Development behavior

- Debug builds use Google's official Android test App ID and anchored banner test unit ID.
- The banner is labeled `IKLAN` and `TEST MODE` in debug builds.
- Test ads are safe for development and must be used instead of real ads while testing.

## Production gate

Release builds do **not** load ads by default. Production loading only becomes active when all of the following are supplied at build time:

- `DIARYQU_ADS_PRODUCTION_ENABLED=true`
- `DIARYQU_ADMOB_APP_ID=<real AdMob app id>`
- `DIARYQU_ADMOB_BANNER_UNIT_ID=<real AdMob banner unit id>`

The values can be supplied through Gradle project properties or environment variables. Do not commit private account configuration to the repository.

If production is enabled while either ID is still a Google sample ID, DiaryQu keeps ads disabled to avoid accidentally shipping test inventory.

## Family-friendly request policy

DiaryQu currently keeps monetization conservative:

- one banner placement only
- no interstitial, rewarded, app-open, or forced full-screen ads
- requests are explicitly non-personalized (`npa=1`)
- Google Mobile Ads request configuration uses maximum ad content rating `G`
- no DiaryQu profile, Family Room, location, finance, agenda, routine, or other first-party user data is added to the ad request

This is intentionally stricter than the minimum implementation because DiaryQu is a family application.

## Before Play Store release

Before turning production ads on:

1. Create/register the Android app in AdMob and create a banner ad unit.
2. Complete the required Google consent/privacy setup for the regions and audience the app will serve.
3. Verify Play Console Data Safety and Families/audience declarations against the final SDK behavior.
4. Supply the three production build properties above in the release environment.
5. Build and test a release candidate without clicking live ads.

Do not enable production ads until the privacy/consent declarations are finalized.
