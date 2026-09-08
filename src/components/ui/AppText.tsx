import React, {type ReactNode} from 'react';
import {StyleSheet, Text, type TextProps, type TextStyle} from 'react-native';

import {colors, textStyles} from '../../constants/theme';

export type AppTextVariant = keyof typeof textStyles;
export type AppTextTone =
  | 'default'
  | 'secondary'
  | 'muted'
  | 'subtle'
  | 'primary'
  | 'danger'
  | 'warning'
  | 'onPrimary';

interface AppTextProps extends TextProps {
  children: ReactNode;
  variant?: AppTextVariant;
  tone?: AppTextTone;
  align?: TextStyle['textAlign'];
}

const toneColors: Record<AppTextTone, string> = {
  default: colors.text,
  secondary: colors.textSecondary,
  muted: colors.textMuted,
  subtle: colors.textSubtle,
  primary: colors.primaryDark,
  danger: colors.danger,
  warning: colors.warningDark,
  onPrimary: colors.textOnPrimary,
};

export function AppText({
  children,
  variant = 'body',
  tone = 'default',
  align,
  style,
  ...textProps
}: AppTextProps) {
  return (
    <Text
      {...textProps}
      style={[
        styles.base,
        textStyles[variant],
        {color: toneColors[tone]},
        align ? {textAlign: align} : undefined,
        style,
      ]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
