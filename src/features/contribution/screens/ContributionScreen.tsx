import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import type {AppStackParamList} from '../../../app/navigation/types';
import {BrandMark} from '../../../components/common/BrandMark';
import {colors, radius, spacing} from '../../../constants/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Contribution'>;

export function ContributionScreen({navigation}: Props) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Kembali</Text>
        </Pressable>

        <View style={styles.hero}>
          <BrandMark />
          <View style={styles.heroIllustration}>
            <Text style={styles.heart}>♥</Text>
          </View>
          <Text style={styles.heroTitle}>Mari Bantu Sesama</Text>
          <Text style={styles.heroSubtitle}>
            Setiap kebaikan membawa harapan baru. DiaryQu hanya menampilkan informasi donasi resmi tanpa memproses pembayaran di dalam aplikasi.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informasi Donasi</Text>
          <Text style={styles.cardDescription}>
            Transaksi dilakukan secara mandiri melalui aplikasi perbankan atau layanan pembayaran milik Anda.
          </Text>

          <View style={styles.infoBox}>
            <View style={styles.infoIcon}><Text style={styles.infoIconText}>▣</Text></View>
            <View style={styles.flexOne}>
              <Text style={styles.infoLabel}>Rekening Resmi</Text>
              <Text style={styles.infoValue}>Belum dikonfigurasi</Text>
              <Text style={styles.infoHint}>
                Nomor rekening dan nama penerima akan ditambahkan setelah data resmi pengelola tersedia.
              </Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <View style={styles.infoIcon}><Text style={styles.infoIconText}>▦</Text></View>
            <View style={styles.flexOne}>
              <Text style={styles.infoLabel}>QRIS Resmi</Text>
              <Text style={styles.infoValue}>Belum tersedia</Text>
              <Text style={styles.infoHint}>
                QRIS hanya akan ditampilkan sebagai informasi statis. DiaryQu tidak menyimpan nominal, pesan, atau status pembayaran.
              </Text>
            </View>
          </View>

          <View style={styles.policyBox}>
            <Text style={styles.policyTitle}>✓ Aman untuk arsitektur Play Store</Text>
            <Text style={styles.policyText}>
              Tidak ada pilihan nominal, payment gateway, checkout, atau pemrosesan donasi di dalam aplikasi.
            </Text>
          </View>
        </View>

        <Text style={styles.footerText}>
          Pastikan selalu memeriksa nama penerima sebelum melakukan transfer.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  content: {padding: spacing.xl, paddingBottom: 44},
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  backText: {color: '#FFFFFF', fontSize: 12, fontWeight: '800'},
  hero: {alignItems: 'center', paddingTop: spacing.xxl},
  heroIllustration: {
    marginTop: spacing.xl,
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#E8F8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: {fontSize: 64, color: colors.primary},
  heroTitle: {marginTop: spacing.xl, color: colors.primaryDark, fontSize: 22, fontWeight: '900'},
  heroSubtitle: {
    marginTop: spacing.sm,
    maxWidth: 340,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  card: {
    marginTop: spacing.xxl,
    borderRadius: radius.xl,
    backgroundColor: '#FFFFFF',
    padding: spacing.xl,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 7},
    elevation: 3,
  },
  cardTitle: {color: colors.text, fontSize: 18, fontWeight: '900'},
  cardDescription: {marginTop: 6, color: colors.textMuted, fontSize: 12, lineHeight: 18},
  infoBox: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: '#C8DDD3',
    borderRadius: radius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FCFEFD',
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DDF5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconText: {color: colors.primaryDark, fontSize: 19, fontWeight: '900'},
  flexOne: {flex: 1},
  infoLabel: {color: colors.primaryDark, fontSize: 12, fontWeight: '800'},
  infoValue: {marginTop: 3, color: colors.text, fontSize: 15, fontWeight: '900'},
  infoHint: {marginTop: 5, color: colors.textMuted, fontSize: 11, lineHeight: 17},
  policyBox: {
    marginTop: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: '#ECFFF7',
    padding: spacing.lg,
  },
  policyTitle: {color: colors.primaryDark, fontSize: 12, fontWeight: '900'},
  policyText: {marginTop: 5, color: colors.primaryDark, fontSize: 11, lineHeight: 17},
  footerText: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
  },
});
