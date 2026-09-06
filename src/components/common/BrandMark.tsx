import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors} from '../../constants/theme';

interface BrandMarkProps {
  light?: boolean;
  compact?: boolean;
}

export function BrandMark({light = false, compact = false}: BrandMarkProps) {
  const textColor = light ? '#FFFFFF' : colors.primaryDark;

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
    gap: 7,
  },
  book: {
    width: 28,
    height: 24,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{rotate: '-5deg'}],
  },
  bookLight: {
    borderColor: '#FFFFFF',
  },
  bookGlyph: {
    color: colors.primary,
    fontSize: 18,
    lineHeight: 18,
    fontWeight: '800',
  },
  bookGlyphLight: {
    color: '#FFFFFF',
  },
  wordmark: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  wordmarkCompact: {
    fontSize: 18,
  },
});
