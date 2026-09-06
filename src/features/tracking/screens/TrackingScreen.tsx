import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {EmptyModuleCard, FeatureScaffold} from '../../../components/common/FeatureScaffold';
import {colors, radius, spacing} from '../../../constants/theme';

export function TrackingScreen() {
  return (
    <FeatureScaffold title="Lokasi Keluarga" subtitle="Pantau dengan izin dan privasi yang jelas" glyph="⌖">
      <View style={styles.mapPlaceholder}>
        <View style={styles.pinOuter}>
          <View style={styles.pinInner} />
        </View>
        <Text style={styles.mapTitle}>Peta belum diaktifkan</Text>
        <Text style={styles.mapText}>
          MapLibre/OSM, permission lokasi, lifecycle, dan realtime sync akan dipasang tanpa melakukan broadcast lokasi terus-menerus.
        </Text>
      </View>
      <EmptyModuleCard
        title="Belum ada lokasi keluarga"
        description="Lokasi anggota akan muncul setelah Family Room aktif dan masing-masing pengguna memberikan consent lokasi."
      />
    </FeatureScaffold>
  );
}

const styles = StyleSheet.create({
  mapPlaceholder: {
    height: 260,
    borderRadius: radius.lg,
    backgroundColor: '#DDEEF0',
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#B8D7D2',
  },
  pinOuter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  pinInner: {width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFFFFF'},
  mapTitle: {fontSize: 16, fontWeight: '800', color: colors.text},
  mapText: {fontSize: 12, color: colors.textMuted, lineHeight: 18, textAlign: 'center', marginTop: 8},
});
