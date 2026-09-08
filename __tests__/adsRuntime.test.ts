import {normalizeAdsConfig} from '../src/features/ads/runtime';

describe('normalizeAdsConfig', () => {
  it('disables ads when native configuration is missing', () => {
    expect(normalizeAdsConfig(null)).toEqual({
      enabled: false,
      testMode: false,
      bannerUnitId: null,
      nonPersonalizedOnly: true,
      maxContentRating: 'G',
    });
  });

  it('does not enable ads without a banner unit id', () => {
    expect(normalizeAdsConfig({enabled: true, bannerUnitId: ''}).enabled).toBe(false);
  });

  it('normalizes a safe native configuration', () => {
    expect(
      normalizeAdsConfig({
        enabled: true,
        testMode: true,
        bannerUnitId: ' test-banner-id ',
        nonPersonalizedOnly: true,
        maxContentRating: 'G',
      }),
    ).toEqual({
      enabled: true,
      testMode: true,
      bannerUnitId: 'test-banner-id',
      nonPersonalizedOnly: true,
      maxContentRating: 'G',
    });
  });

  it('keeps non-personalized mode on by default', () => {
    const config = normalizeAdsConfig({
      enabled: true,
      bannerUnitId: 'banner-id',
    });

    expect(config.nonPersonalizedOnly).toBe(true);
    expect(config.maxContentRating).toBe('G');
  });
});
