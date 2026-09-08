import React, {type ReactNode} from 'react';
import {StyleSheet, View, type ViewStyle} from 'react-native';

import {colors, radius, spacing} from '../../constants/theme';
import {AppText} from './AppText';

export type ScreenHeaderVariant = 'plain' | 'primary';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  variant?: ScreenHeaderVariant;
  style?: ViewStyle;
}

export function ScreenHeader({
  title,
  subtitle,
  left,
  right,
  variant = 'plain',
  style,
}: ScreenHeaderProps) {
  const isPrimary = variant === 'primary';

  return (
    <View
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.plain,
        style,
      ]}>
      {left ? <View style={styles.side}>{left}</View> : null}
      <View style={styles.textWrap}>
        <AppText variant="heading" tone={isPrimary ? 'onPrimary' : 'default'}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText
            variant="bodySmall"
            tone={isPrimary ? 'onPrimary' : 'muted'}
            style={[styles.subtitle, isPrimary ? styles.subtitlePrimary : undefined]}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ? <View style={styles.side}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    minHeight: 88,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  plain: {backgroundColor: colors.surface},
  primary: {backgroundColor: colors.primaryStrong},
  textWrap: {flex: 1},
  subtitle: {marginTop: spacing.xs},
  subtitlePrimary: {opacity: 0.9},
  side: {alignItems: 'center', justifyContent: 'center'},
});
