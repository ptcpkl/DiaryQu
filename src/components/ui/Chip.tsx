import React from 'react';
import {Pressable, StyleSheet, View, type PressableProps, type ViewStyle} from 'react-native';

import {colors, controlSize, radius, spacing} from '../../constants/theme';
import {AppText} from './AppText';

export type ChipTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

interface ChipProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  selected?: boolean;
  tone?: ChipTone;
  leadingDot?: boolean;
  style?: ViewStyle;
}

const backgroundByTone: Record<ChipTone, string> = {
  neutral: colors.surfaceMuted,
  primary: colors.primarySoft,
  success: colors.successSoft,
  warning: colors.warningSoft,
  danger: colors.dangerSoft,
};

const dotByTone: Record<ChipTone, string> = {
  neutral: colors.textMuted,
  primary: colors.primary,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
};

export function Chip({
  label,
  selected = false,
  tone = 'neutral',
  leadingDot = false,
  disabled,
  style,
  onPress,
  ...pressableProps
}: ChipProps) {
  const content = (
    <>
      {leadingDot ? <View style={[styles.dot, {backgroundColor: dotByTone[tone]}]} /> : null}
      <AppText
        variant="label"
        tone={selected || tone === 'primary' || tone === 'success' ? 'primary' : 'secondary'}>
        {label}
      </AppText>
    </>
  );

  return (
    <Pressable
      {...pressableProps}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{selected, disabled: Boolean(disabled)}}
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({pressed}) => [
        styles.base,
        {backgroundColor: backgroundByTone[tone]},
        selected ? styles.selected : undefined,
        pressed ? styles.pressed : undefined,
        disabled ? styles.disabled : undefined,
        style,
      ]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: controlSize.chip,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selected: {borderColor: colors.primary},
  pressed: {opacity: 0.8},
  disabled: {opacity: 0.5},
  dot: {width: 7, height: 7, borderRadius: 4},
});
