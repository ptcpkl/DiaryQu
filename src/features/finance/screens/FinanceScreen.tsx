import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {EmptyModuleCard, FeatureScaffold} from '../../../components/common/FeatureScaffold';
import {colors, radius, spacing} from '../../../constants/theme';

export function FinanceScreen() {
  return (
    <FeatureScaffold title="Mari Menabung" subtitle="Jangan lupakan sedekah ya" glyph="▣">
      <View style={styles.toggle}>
        <View style={styles.activeTab}><Text style={styles.activeText}>Keuangan</Text></View>
        <View style={styles.inactiveTab}><Text style={styles.inactiveText}>AssetQu</Text></View>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Saldo</Text>
        <Text style={styles.balanceValue}>Rp 0</Text>
        <Text style={styles.balanceHint}>Saldo dihitung dari seluruh transaksi income dan expense.</Text>
      </View>

      <EmptyModuleCard
        title="Belum ada transaksi"
        description="Riwayat transaksi, statistik bulanan, statistik tahunan, dan AssetQu akan dihubungkan ke repository/service Supabase pada milestone Finance."
      />
    </FeatureScaffold>
  );
}

const styles = StyleSheet.create({
  toggle: {height: 46, borderRadius: 23, backgroundColor: '#DDE8FF', flexDirection: 'row', padding: 4},
  activeTab: {flex: 1, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center'},
  inactiveTab: {flex: 1, borderRadius: 19, alignItems: 'center', justifyContent: 'center'},
  activeText: {color: colors.primaryDark, fontWeight: '800', fontSize: 13},
  inactiveText: {color: colors.textMuted, fontWeight: '700', fontSize: 13},
  balanceCard: {borderWidth: 1.2, borderColor: colors.primary, borderRadius: radius.lg, backgroundColor: '#EAFBF3', padding: spacing.xl},
  balanceLabel: {fontSize: 14, color: colors.textMuted},
  balanceValue: {fontSize: 28, color: colors.primary, fontWeight: '900', marginTop: 6},
  balanceHint: {fontSize: 11, color: colors.textMuted, marginTop: 6, lineHeight: 16},
});
