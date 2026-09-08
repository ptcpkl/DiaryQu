import React, {type ReactNode} from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {colors, radius, shadows, spacing} from '../../constants/theme';

export type AppCardVariant = 'default' | 'soft' | 'outlined' | 'primary';
export type AppCardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface AppCardProps extends Omit<PressableProps, 'children' | 'style'> {
  children: ReactNode;
  variant?: AppCardVariant;
  padding?: AppCardPadding;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: PressableProps['onPress'];
}

const paddingBySize: Record<AppCardPadding, number> = {
  none: 0,
  sm: spacing.md,
  md: spacing.lg,
  lg: spacing.xl,
  xl: spacing.xxl,
};

const backgroundByVariant: Record<AppCardVariant, string> = {
  default: colors.surface,
  soft: colors.primarySoft,
  outlined: colors.surface,
  primary: colors.primary,
};

export function AppCard({
  children,
  variant = 'default',
  padding = 'md',
  elevated = false,
  style,
  onPress,
  ...pressableProps
}: AppCardProps) {
  const baseStyle: StyleProp<ViewStyle> = [
    styles.base,
    {
      backgroundColor: backgroundByVariant[variant],
      padding: paddingBySize[padding],
    },
    variant === 'outlined' ? styles.outlined : undefined,
    elevated ? shadows.md : shadows.none,
    style,
  ];

  if (!onPress) {
    return <View style={baseStyle}>{children}</View>;
  }

  return (
    <Pressable
      {...pressableProps}
      onPress={onPress}
      style={({pressed}) => [baseStyle, pressed ? styles.pressed : undefined]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    borderRadius: radius.md,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.9,
    transform: [{scale: 0.997}],
  },
});
