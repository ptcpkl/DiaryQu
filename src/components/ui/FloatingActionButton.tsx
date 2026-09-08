import React, {type ReactNode} from 'react';
import {Pressable, StyleSheet, View, type ViewStyle} from 'react-native';

import {colors, controlSize, radius, shadows, spacing} from '../../constants/theme';
import {AppText} from './AppText';

interface FloatingActionButtonProps {
  onPress: () => void;
  accessibilityLabel: string;
  glyph?: string;
  icon?: ReactNode;
  label?: string;
  extended?: boolean;
  style?: ViewStyle;
}

export function FloatingActionButton({
  onPress,
  accessibilityLabel,
  glyph = '+',
  icon,
  label,
  extended = false,
  style,
}: FloatingActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      style={({pressed}) => [
        styles.base,
        extended ? styles.extended : styles.round,
        shadows.lg,
        pressed ? styles.pressed : undefined,
        style,
      ]}>
      <View style={styles.content}>
        {icon ?? (
          <AppText variant="heading" tone="onPrimary" style={styles.glyph}>
            {glyph}
          </AppText>
        )}
        {extended && label ? (
          <AppText variant="button" tone="onPrimary">
            {label}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  round: {
    width: controlSize.fab,
    height: controlSize.fab,
  },
  extended: {
    minHeight: controlSize.fab,
    paddingHorizontal: spacing.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  glyph: {fontSize: 28, lineHeight: 30},
  pressed: {opacity: 0.86, transform: [{scale: 0.97}]},
});
