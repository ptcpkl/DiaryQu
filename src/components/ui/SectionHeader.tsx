import React from 'react';
import {Pressable, StyleSheet, View, type ViewStyle} from 'react-native';

import {spacing} from '../../constants/theme';
import {AppText} from './AppText';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.textWrap}>
        <AppText variant="section">{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted" style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {actionLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          disabled={!onAction}
          onPress={onAction}
          hitSlop={8}
          style={({pressed}) => [pressed ? styles.pressed : undefined]}>
          <AppText variant="label" tone="primary">
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  textWrap: {flex: 1},
  subtitle: {marginTop: spacing.xs},
  pressed: {opacity: 0.65},
});
