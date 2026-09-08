export interface AdsRuntimeConfig {
  enabled: boolean;
  testMode: boolean;
  bannerUnitId: string | null;
  nonPersonalizedOnly: boolean;
  maxContentRating: string;
}
