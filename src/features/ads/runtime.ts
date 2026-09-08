import {NativeModules, Platform} from 'react-native';

import type {AdsRuntimeConfig} from './types';

const DISABLED_CONFIG: AdsRuntimeConfig = {
  enabled: false,
  testMode: false,
  bannerUnitId: null,
  nonPersonalizedOnly: true,
  maxContentRating: 'G',
};

export function normalizeAdsConfig(value: unknown): AdsRuntimeConfig {
  if (!value || typeof value !== 'object') return DISABLED_CONFIG;

  const raw = value as Record<string, unknown>;
  const bannerUnitId =
    typeof raw.bannerUnitId === 'string' && raw.bannerUnitId.trim()
      ? raw.bannerUnitId.trim()
      : null;

  const enabled = raw.enabled === true && Boolean(bannerUnitId);

  return {
    enabled,
    testMode: raw.testMode === true,
    bannerUnitId,
    nonPersonalizedOnly: raw.nonPersonalizedOnly !== false,
    maxContentRating:
      typeof raw.maxContentRating === 'string' && raw.maxContentRating.trim()
        ? raw.maxContentRating.trim()
        : 'G',
  };
}

export function getAdsRuntimeConfig(): AdsRuntimeConfig {
  if (Platform.OS !== 'android') return DISABLED_CONFIG;
  return normalizeAdsConfig(NativeModules.DiaryQuAdsConfig);
}
