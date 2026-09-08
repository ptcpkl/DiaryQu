import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, fontWeight, radius, spacing, typography} from '../../constants/theme';

interface BrandMarkProps {
  light?: boolean;
  compact?: boolean;
}

export function BrandMark({light = false, compact = false}: BrandMarkProps) {
  const textColor = light ? colors.primaryOn : colors.primaryDark;

  return (
    <View style={styles.row} accessibilityRole="image" accessibilityLabel="DiaryQu">
      <View style={[styles.book, light && styles.bookLight]}>
        <Text style={[styles.bookGlyph, light && styles.bookGlyphLight]}>⌁</Text>
      </View>
      <Text
        style={[
          styles.wordmark,
          {color: textColor},
          compact && styles.wordmarkCompact,
        ]}>
        DiaryQu
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  book: {
    width: 28,
    height: 24,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{rotate: '-5deg'}],
  },
  bookLight: {
    borderColor: colors.primaryOn,
  },
  bookGlyph: {
    color: colors.primary,
    fontSize: 18,
    lineHeight: 18,
    fontWeight: fontWeight.extrabold,
  },
  bookGlyphLight: {
    color: colors.primaryOn,
  },
  wordmark: {
    fontSize: 22,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.5,
  },
  wordmarkCompact: {
    fontSize: typography.section,
  },
});
