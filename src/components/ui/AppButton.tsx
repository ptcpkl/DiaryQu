import React, {type ReactNode} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import {
  colors,
  controlSize,
  radius,
  spacing,
} from '../../constants/theme';
import {AppText} from './AppText';

export type AppButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type AppButtonSize = 'sm' | 'md' | 'lg';

interface AppButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  style?: ViewStyle;
}

const heightBySize: Record<AppButtonSize, number> = {
  sm: controlSize.buttonSm,
  md: controlSize.buttonMd,
  lg: controlSize.buttonLg,
};

const backgroundByVariant: Record<AppButtonVariant, string> = {
  primary: colors.primary,
  secondary: colors.primarySoft,
  outline: colors.surface,
  danger: colors.danger,
  ghost: 'transparent',
};

const textToneByVariant = {
  primary: 'onPrimary',
  secondary: 'primary',
  outline: 'primary',
  danger: 'onPrimary',
  ghost: 'primary',
} as const;

export function AppButton({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  disabled,
  style,
  accessibilityLabel,
  ...pressableProps
}: AppButtonProps) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      {...pressableProps}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{disabled: isDisabled, busy: loading}}
      disabled={isDisabled}
      style={({pressed}) => [
        styles.base,
        {
          minHeight: heightBySize[size],
          backgroundColor: backgroundByVariant[variant],
        },
        variant === 'outline' && styles.outline,
        fullWidth ? styles.fullWidth : styles.contentWidth,
        pressed && !isDisabled ? styles.pressed : undefined,
        isDisabled ? styles.disabled : undefined,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? colors.primaryOn : colors.primaryDark}
        />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
          <AppText variant="button" tone={textToneByVariant[variant]} align="center">
            {label}
          </AppText>
          {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  fullWidth: {width: '100%'},
  contentWidth: {alignSelf: 'flex-start'},
  outline: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {opacity: 0.84, transform: [{scale: 0.995}]},
  disabled: {opacity: 0.52},
});
