import React, {type ReactNode} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {colors, radius, spacing} from '../../constants/theme';

interface FeatureScaffoldProps {
  title: string;
  subtitle: string;
  glyph: string;
  children?: ReactNode;
}

export function FeatureScaffold({
  title,
  subtitle,
  glyph,
  children,
}: FeatureScaffoldProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={styles.glyphCircle}>
            <Text style={styles.glyph}>{glyph}</Text>
          </View>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function EmptyModuleCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyDot} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  content: {padding: spacing.xl, paddingBottom: 110, gap: spacing.xl},
  hero: {
    minHeight: 112,
    borderRadius: radius.md,
    backgroundColor: '#2AA779',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  heroText: {flex: 1, paddingRight: 12},
  title: {color: '#FFFFFF', fontSize: 21, fontWeight: '800'},
  subtitle: {color: '#E8FFF6', fontSize: 14, marginTop: 7},
  glyphCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {color: '#FFFFFF', fontSize: 36, fontWeight: '900'},
  emptyCard: {
    minHeight: 190,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 5},
    elevation: 2,
  },
  emptyDot: {width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primarySoft, marginBottom: 14},
  emptyTitle: {fontSize: 16, fontWeight: '800', color: colors.text, textAlign: 'center'},
  emptyDescription: {fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19, marginTop: 7},
});
