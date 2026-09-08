import React, {type ReactNode} from 'react';
import {StyleSheet, View, type ViewStyle} from 'react-native';

import {colors, iconSize, radius} from '../../constants/theme';
import {AppText} from './AppText';

export type IconBadgeSize = 'sm' | 'md' | 'lg';
export type IconBadgeTone = 'primary' | 'neutral' | 'info' | 'warning' | 'danger';

interface IconBadgeProps {
  glyph?: string;
  children?: ReactNode;
  size?: IconBadgeSize;
  tone?: IconBadgeTone;
  style?: ViewStyle;
}

const dimensionBySize: Record<IconBadgeSize, number> = {
  sm: 32,
  md: 42,
  lg: 52,
};

const glyphSizeBySize: Record<IconBadgeSize, number> = {
  sm: iconSize.sm,
  md: iconSize.md,
  lg: iconSize.lg,
};

const backgroundByTone: Record<IconBadgeTone, string> = {
  primary: colors.primarySoft,
  neutral: colors.surfaceMuted,
  info: colors.infoSoft,
  warning: colors.warningSoft,
  danger: colors.dangerSoft,
};

const textToneByTone = {
  primary: 'primary',
  neutral: 'secondary',
  info: 'secondary',
  warning: 'warning',
  danger: 'danger',
} as const;

export function IconBadge({
  glyph,
  children,
  size = 'md',
  tone = 'primary',
  style,
}: IconBadgeProps) {
  const dimension = dimensionBySize[size];

  return (
    <View
      style={[
        styles.base,
        {
          width: dimension,
          height: dimension,
          borderRadius: radius.pill,
          backgroundColor: backgroundByTone[tone],
        },
        style,
      ]}>
      {children ?? (
        <AppText
          variant="bodyStrong"
          tone={textToneByTone[tone]}
          style={{fontSize: glyphSizeBySize[size], lineHeight: glyphSizeBySize[size] + 2}}>
          {glyph ?? '•'}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
