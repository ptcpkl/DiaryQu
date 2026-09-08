import React, {useMemo} from 'react';
import {
  Platform,
  StyleSheet,
  View,
  requireNativeComponent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {AppText} from '../../../components/ui';
import {colors, radius, spacing} from '../../../constants/theme';
import {getAdsRuntimeConfig} from '../runtime';

type NativeBannerProps = {
  adUnitId: string;
  style?: StyleProp<ViewStyle>;
};

const NativeBanner =
  Platform.OS === 'android'
    ? requireNativeComponent<NativeBannerProps>('DiaryQuBannerAdView')
    : null;

interface DiaryQuBannerAdProps {
  placement?: string;
  style?: StyleProp<ViewStyle>;
}

export function DiaryQuBannerAd({
  placement = 'banner',
  style,
}: DiaryQuBannerAdProps) {
  const config = useMemo(() => getAdsRuntimeConfig(), []);

  if (!config.enabled || !config.bannerUnitId || !NativeBanner) {
    return null;
  }

  return (
    <View
      accessibilityLabel={`Iklan ${placement}`}
      style={[styles.wrapper, style]}>
      <View style={styles.labelRow}>
        <AppText variant="micro" tone="muted">
          IKLAN
        </AppText>
        {config.testMode ? (
          <View style={styles.testPill}>
            <AppText variant="micro" tone="primary">
              TEST MODE
            </AppText>
          </View>
        ) : null}
      </View>
      <NativeBanner adUnitId={config.bannerUnitId} style={styles.banner} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    overflow: 'hidden',
  },
  labelRow: {
    width: '100%',
    minHeight: 18,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  testPill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.primarySoft,
  },
  banner: {
    width: 320,
    height: 50,
    marginTop: spacing.xs,
  },
});
