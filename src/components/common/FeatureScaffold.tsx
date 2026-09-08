import React, {type ReactNode} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {colors, layout, spacing} from '../../constants/theme';
import {AppCard, AppText, IconBadge, ScreenHeader} from '../ui';

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
        <ScreenHeader
          title={title}
          subtitle={subtitle}
          variant="primary"
          right={
            <View style={styles.heroIconWrap}>
              <AppText variant="heading" tone="onPrimary" style={styles.heroGlyph}>
                {glyph}
              </AppText>
            </View>
          }
        />
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
    <AppCard padding="lg" elevated style={styles.emptyCard}>
      <IconBadge glyph="•" size="lg" tone="primary" />
      <AppText variant="section" align="center" style={styles.emptyTitle}>
        {title}
      </AppText>
      <AppText variant="bodySmall" tone="muted" align="center" style={styles.emptyDescription}>
        {description}
      </AppText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  content: {
    padding: layout.screenPadding,
    paddingBottom: 110,
    gap: spacing.xl,
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGlyph: {fontSize: 36, lineHeight: 40},
  emptyCard: {
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {marginTop: spacing.md},
  emptyDescription: {marginTop: spacing.sm, maxWidth: 330},
});
