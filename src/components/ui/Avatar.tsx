import React from 'react';
import {Image, StyleSheet, View, type ImageSourcePropType, type ViewStyle} from 'react-native';

import {colors, controlSize, radius} from '../../constants/theme';
import {AppText} from './AppText';

export type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  name: string;
  source?: ImageSourcePropType;
  size?: AvatarSize;
  bordered?: boolean;
  style?: ViewStyle;
}

const dimensionBySize: Record<AvatarSize, number> = {
  sm: controlSize.avatarSm,
  md: controlSize.avatarMd,
  lg: controlSize.avatarLg,
};

export function Avatar({
  name,
  source,
  size = 'md',
  bordered = true,
  style,
}: AvatarProps) {
  const dimension = dimensionBySize[size];
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('') || 'DQ';

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Foto profil ${name}`}
      style={[
        styles.base,
        {
          width: dimension,
          height: dimension,
          borderRadius: radius.pill,
        },
        bordered ? styles.bordered : undefined,
        style,
      ]}>
      {source ? (
        <Image source={source} style={styles.image} resizeMode="cover" />
      ) : (
        <AppText
          variant="bodyStrong"
          tone="primary"
          style={{fontSize: Math.max(12, Math.round(dimension * 0.32))}}>
          {initials}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  bordered: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  image: {width: '100%', height: '100%'},
});
