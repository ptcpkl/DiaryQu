import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useMemo} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import type {AppStackParamList} from '../../../app/navigation/types';
import {colors, radius, spacing} from '../../../constants/theme';
import {useAuthStore} from '../../auth/store/authStore';
import {useFamilyStore} from '../../family/store/familyStore';

type Props = NativeStackScreenProps<AppStackParamList, 'Profile'>;

export function ProfileScreen({navigation}: Props) {
  const session = useAuthStore(state => state.session);
  const signOut = useAuthStore(state => state.signOut);
  const family = useFamilyStore(state => state.family);

  const displayName = useMemo(() => {
    const fullName = session?.user.user_metadata?.full_name;
    if (typeof fullName === 'string' && fullName.trim()) {
      return fullName.trim();
    }
    return session?.user.email?.split('@')[0] ?? 'Pengguna DiaryQu';
  }, [session]);

  const roleLabel = family?.role === 'head' ? 'Kepala Keluarga' : 'Anggota Keluarga';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>‹ Kembali</Text>
          </Pressable>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.slice(0, 1).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{roleLabel}</Text>
          </View>
        </View>

        <View style={styles.cardFloating}>
          <Text style={styles.cardTitle}>📍 Lokasi Anda Saat Ini</Text>
          <View style={styles.locationBox}>
            <Text style={styles.locationLabel}>Alamat:</Text>
            <Text style={styles.locationValue}>Lokasi belum diaktifkan</Text>
            <View style={styles.divider} />
            <Text style={styles.locationTime}>◷ Aktifkan izin lokasi untuk memperbarui posisi.</Text>
          </View>

          <Text style={styles.subsectionTitle}>Family Room</Text>
          <View style={styles.familyRow}>
            <View style={styles.familyIcon}><Text style={styles.familyIconText}>⌂</Text></View>
            <View style={styles.flexOne}>
              <Text style={styles.familyName}>{family?.name ?? 'Family Room DiaryQu'}</Text>
              <Text style={styles.familyCode}>Family Code: {family?.familyCode ?? '—'}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </View>

        <Text style={styles.settingsLabel}>SETTINGS</Text>
        <View style={styles.settingsCard}>
          <SettingsRow glyph="👥" title="Informasi Keluarga" />
          <View style={styles.rowDivider} />
          <SettingsRow glyph="⚙" title="Pengaturan Akun" />
        </View>

        <Pressable onPress={() => signOut()} style={styles.logoutButton}>
          <Text style={styles.logoutText}>↪ Keluar</Text>
        </Pressable>

        <View style={styles.donationBanner}>
          <View style={styles.flexOne}>
            <Text style={styles.donationTitle}>Berbagi Kebaikan 💚</Text>
            <Text style={styles.donationCaption}>
              Sedikit bantuanmu bisa berarti besar bagi mereka.
            </Text>
            <Pressable
              onPress={() => navigation.navigate('Contribution')}
              style={styles.donationButton}>
              <Text style={styles.donationButtonText}>Donasi Sekarang</Text>
            </Pressable>
          </View>
          <View style={styles.donationIllustration}>
            <Text style={styles.donationIllustrationText}>☺</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({glyph, title}: {glyph: string; title: string}) {
  return (
    <Pressable style={styles.settingsRow}>
      <View style={styles.settingsIcon}>
        <Text style={styles.settingsIconText}>{glyph}</Text>
      </View>
      <Text style={styles.settingsTitle}>{title}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  content: {paddingBottom: 40},
  hero: {
    minHeight: 280,
    backgroundColor: '#2CA67C',
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backText: {color: colors.primaryDark, fontWeight: '800', fontSize: 12},
  avatar: {
    marginTop: spacing.md,
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#F5FAF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {color: colors.primaryDark, fontWeight: '900', fontSize: 36},
  name: {marginTop: spacing.md, color: '#FFFFFF', fontSize: 22, fontWeight: '900'},
  rolePill: {
    marginTop: 8,
    borderRadius: radius.pill,
    backgroundColor: '#F6D96B',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  roleText: {color: '#6A5A14', fontWeight: '700', fontSize: 12},
  cardFloating: {
    marginTop: -28,
    marginHorizontal: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: '#FFFFFF',
    padding: spacing.xl,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 4,
  },
  cardTitle: {fontSize: 15, color: colors.text, fontWeight: '800'},
  locationBox: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#EEF8F3',
    padding: spacing.lg,
  },
  locationLabel: {color: colors.primary, fontWeight: '800', fontSize: 12},
  locationValue: {marginTop: 4, color: colors.text, fontSize: 13},
  divider: {height: 1, backgroundColor: '#BFDCCF', marginVertical: 10},
  locationTime: {color: colors.textMuted, fontSize: 11},
  subsectionTitle: {marginTop: spacing.xl, color: colors.text, fontWeight: '800', fontSize: 14},
  familyRow: {
    marginTop: spacing.md,
    minHeight: 64,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  familyIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ECFFF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyIconText: {color: colors.primary, fontSize: 20, fontWeight: '900'},
  familyName: {color: colors.text, fontSize: 13, fontWeight: '800'},
  familyCode: {marginTop: 2, color: colors.textMuted, fontSize: 11},
  flexOne: {flex: 1},
  chevron: {fontSize: 28, color: '#47524E', lineHeight: 28},
  settingsLabel: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.xl,
    color: '#5A625F',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  settingsCard: {
    marginTop: spacing.md,
    marginHorizontal: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 5},
    elevation: 2,
  },
  settingsRow: {minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 14},
  settingsIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#D9F3E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIconText: {fontSize: 20},
  settingsTitle: {flex: 1, color: colors.text, fontSize: 14, fontWeight: '700'},
  rowDivider: {height: 1, backgroundColor: '#EEF1F0'},
  logoutButton: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.xl,
    minHeight: 60,
    borderRadius: radius.md,
    backgroundColor: '#DE3704',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoutText: {color: '#FFFFFF', fontWeight: '800', fontSize: 15},
  donationBanner: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.xl,
    minHeight: 150,
    borderRadius: radius.lg,
    backgroundColor: '#20B97F',
    padding: spacing.xl,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  donationTitle: {color: '#FFFFFF', fontSize: 16, fontWeight: '900'},
  donationCaption: {marginTop: 6, maxWidth: 205, color: '#E9FFF7', fontSize: 12, lineHeight: 17},
  donationButton: {
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  donationButtonText: {color: colors.primaryDark, fontSize: 11, fontWeight: '800'},
  donationIllustration: {
    width: 92,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  donationIllustrationText: {fontSize: 70, color: '#FFFFFF'},
});
