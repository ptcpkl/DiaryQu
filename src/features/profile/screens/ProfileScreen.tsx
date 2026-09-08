import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useEffect, useMemo} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import type {AppStackParamList} from '../../../app/navigation/types';
import {
  AppButton,
  AppCard,
  AppText,
  Avatar,
  Chip,
} from '../../../components/ui';
import {colors, layout, radius, shadows, spacing} from '../../../constants/theme';
import {useAuthStore} from '../../auth/store/authStore';
import {useFamilyStore} from '../../family/store/familyStore';
import {sortFamilyMembers} from '../../family/utils/family';
import {useTrackingStore} from '../../tracking/store/trackingStore';
import {
  formatApproximateCoordinate,
  formatLocationAge,
} from '../../tracking/utils/tracking';
import {useProfileStore} from '../store/profileStore';

type Props = NativeStackScreenProps<AppStackParamList, 'Profile'>;

export function ProfileScreen({navigation}: Props) {
  const session = useAuthStore(state => state.session);
  const signOut = useAuthStore(state => state.signOut);
  const family = useFamilyStore(state => state.family);
  const members = useFamilyStore(state => state.members);
  const memberStatus = useFamilyStore(state => state.memberStatus);
  const loadMembers = useFamilyStore(state => state.loadMembers);

  const profile = useProfileStore(state => state.profile);
  const isProfileLoading = useProfileStore(state => state.isLoading);
  const loadProfile = useProfileStore(state => state.load);

  const locations = useTrackingStore(state => state.locations);
  const trackingFamilyId = useTrackingStore(state => state.currentFamilyId);
  const loadTracking = useTrackingStore(state => state.load);

  useEffect(() => {
    if (!profile && !isProfileLoading) loadProfile().catch(() => undefined);
  }, [isProfileLoading, loadProfile, profile]);

  useEffect(() => {
    if (memberStatus === 'idle') loadMembers().catch(() => undefined);
  }, [loadMembers, memberStatus]);

  useEffect(() => {
    if (family?.id && trackingFamilyId !== family.id) {
      loadTracking(family.id).catch(() => undefined);
    }
  }, [family?.id, loadTracking, trackingFamilyId]);

  const displayName = useMemo(() => {
    if (profile?.fullName) return profile.fullName;
    const fullName = session?.user.user_metadata?.full_name;
    if (typeof fullName === 'string' && fullName.trim()) return fullName.trim();
    return session?.user.email?.split('@')[0] ?? 'Pengguna DiaryQu';
  }, [profile?.fullName, session]);

  const userId = profile?.id ?? session?.user.id ?? null;
  const currentLocation = useMemo(
    () => locations.find(item => item.userId === userId) ?? null,
    [locations, userId],
  );
  const sortedMembers = useMemo(() => sortFamilyMembers(members), [members]);
  const shortcutMembers = sortedMembers.filter(member => member.id !== userId).slice(0, 4);
  const roleLabel = family?.role === 'head' ? 'Kepala Keluarga' : 'Anggota Keluarga';
  const hasSharedLocation = Boolean(
    currentLocation?.sharingEnabled &&
      currentLocation.latitude !== null &&
      currentLocation.longitude !== null,
  );

  const confirmLogout = () => {
    Alert.alert('Keluar dari DiaryQu?', 'Sesi akun di perangkat ini akan diakhiri.', [
      {text: 'Batal', style: 'cancel'},
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: () => signOut().catch(() => undefined),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroOrbLarge} />
          <View style={styles.heroOrbSmall} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <AppText variant="label" tone="onPrimary">‹ Kembali</AppText>
          </Pressable>

          <Avatar
            name={displayName}
            source={profile?.avatarUrl ? {uri: profile.avatarUrl} : undefined}
            size="lg"
            style={styles.heroAvatar}
          />
          <AppText variant="title" tone="onPrimary" align="center">{displayName}</AppText>
          <Chip label={roleLabel} tone="warning" />
          <AppText variant="caption" tone="onPrimary" align="center" style={styles.heroEmail}>
            {profile?.email ?? session?.user.email ?? 'Akun DiaryQu'}
          </AppText>
        </View>

        <AppCard padding="lg" elevated style={styles.floatingCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.sectionIcon}>
              <AppText variant="section" tone="primary">⌖</AppText>
            </View>
            <View style={styles.flexOne}>
              <AppText variant="section">Lokasi Anda Saat Ini</AppText>
              <AppText variant="caption" tone="muted">
                Lokasi terakhir yang Anda pilih untuk dibagikan.
              </AppText>
            </View>
            <Chip
              label={hasSharedLocation ? 'Dibagikan' : 'Privat'}
              tone={hasSharedLocation ? 'success' : 'neutral'}
              leadingDot
            />
          </View>

          <View style={styles.locationBox}>
            {hasSharedLocation ? (
              <>
                <AppText variant="micro" tone="muted">KOORDINAT PERKIRAAN</AppText>
                <AppText variant="bodyStrong">
                  {formatApproximateCoordinate(currentLocation?.latitude ?? null)}, {' '}
                  {formatApproximateCoordinate(currentLocation?.longitude ?? null)}
                </AppText>
                <View style={styles.locationDivider} />
                <AppText variant="caption" tone="muted">
                  {formatLocationAge(currentLocation)}
                  {currentLocation?.accuracyMeters
                    ? ` · akurasi ±${Math.round(currentLocation.accuracyMeters)} m`
                    : ''}
                </AppText>
              </>
            ) : (
              <>
                <AppText variant="bodyStrong">Lokasi belum dibagikan</AppText>
                <AppText variant="caption" tone="muted">
                  DiaryQu tidak melacak lokasi di background. Buka Tracking untuk membagikan posisi secara sadar.
                </AppText>
              </>
            )}
          </View>

          <AppButton
            label={hasSharedLocation ? 'Lihat di Tracking' : 'Buka Pengaturan Lokasi'}
            variant="secondary"
            size="sm"
            onPress={() => navigation.navigate('MainTabs', {screen: 'Tracking'})}
          />
        </AppCard>

        <View style={styles.sectionHeader}>
          <View>
            <AppText variant="section">Lihat Lokasi Keluarga</AppText>
            <AppText variant="caption" tone="muted">
              Pintasan anggota Family Room untuk membuka halaman Tracking.
            </AppText>
          </View>
          <Pressable onPress={() => navigation.navigate('MainTabs', {screen: 'Tracking'})} hitSlop={8}>
            <AppText variant="label" tone="primary">Lihat semua</AppText>
          </Pressable>
        </View>

        {shortcutMembers.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.shortcutList}>
            {shortcutMembers.map(member => (
              <Pressable
                key={member.id}
                onPress={() => navigation.navigate('MainTabs', {screen: 'Tracking'})}
                style={({pressed}) => [styles.shortcutCard, pressed ? styles.pressed : undefined]}>
                <Avatar name={member.fullName} size="md" />
                <View style={styles.flexOne}>
                  <AppText variant="label" numberOfLines={1}>{member.fullName}</AppText>
                  <AppText variant="micro" tone="muted">
                    {member.role === 'head' ? 'Kepala Keluarga' : 'Anggota'}
                  </AppText>
                </View>
                <View style={styles.pinBadge}>
                  <AppText variant="label" tone="primary">⌖</AppText>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <AppCard padding="md" style={styles.emptyFamilyCard}>
            <AppText variant="caption" tone="muted">
              Belum ada anggota lain yang dapat ditampilkan sebagai pintasan.
            </AppText>
          </AppCard>
        )}

        <View style={styles.sectionHeader}>
          <View>
            <AppText variant="section">Settings</AppText>
            <AppText variant="caption" tone="muted">Kelola keluarga dan data akun Anda.</AppText>
          </View>
        </View>

        <AppCard padding="none" elevated style={styles.settingsCard}>
          <SettingsRow
            glyph="⌂"
            title="Informasi Keluarga"
            subtitle={`${family?.name ?? 'Family Room'} · ${family?.familyCode ?? '—'}`}
            onPress={() => navigation.navigate('FamilyInfo')}
          />
          <View style={styles.rowDivider} />
          <SettingsRow
            glyph="⚙"
            title="Pengaturan Akun"
            subtitle="Nama lengkap, nomor telepon, dan identitas akun"
            onPress={() => navigation.navigate('AccountSettings')}
          />
        </AppCard>

        <AppButton
          label="Keluar"
          variant="danger"
          size="lg"
          onPress={confirmLogout}
        />

        <AppCard padding="lg" style={styles.donationBanner}>
          <View style={styles.donationCopy}>
            <AppText variant="section" tone="onPrimary">Berbagi Kebaikan 💚</AppText>
            <AppText variant="caption" tone="onPrimary" style={styles.donationCaption}>
              Sedikit bantuan bisa berarti besar. Lihat informasi kontribusi resmi DiaryQu.
            </AppText>
            <AppButton
              label="Donasi Sekarang"
              variant="outline"
              size="sm"
              fullWidth={false}
              onPress={() => navigation.navigate('Contribution')}
              style={styles.donationButton}
            />
          </View>
          <View style={styles.donationMark}>
            <AppText variant="title" tone="onPrimary">♥</AppText>
          </View>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({
  glyph,
  title,
  subtitle,
  onPress,
}: {
  glyph: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [styles.settingsRow, pressed ? styles.pressed : undefined]}>
      <View style={styles.settingsIcon}>
        <AppText variant="section" tone="primary">{glyph}</AppText>
      </View>
      <View style={styles.flexOne}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" tone="muted" numberOfLines={2}>{subtitle}</AppText>
      </View>
      <AppText variant="heading" tone="muted">›</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  content: {paddingBottom: spacing.jumbo},
  hero: {
    minHeight: 300,
    backgroundColor: colors.primaryStrong,
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingHorizontal: layout.screenPadding,
    overflow: 'hidden',
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroOrbLarge: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: colors.overlayLight,
    right: -90,
    top: -70,
  },
  heroOrbSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.overlayLight,
    left: -50,
    bottom: 30,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.overlayLight,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatar: {
    width: 92,
    height: 92,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: colors.surface,
    backgroundColor: colors.surface,
  },
  heroEmail: {marginTop: spacing.sm, opacity: 0.88},
  floatingCard: {
    marginTop: -28,
    marginHorizontal: layout.screenPadding,
    gap: spacing.md,
  },
  cardHeaderRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexOne: {flex: 1},
  locationBox: {padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, gap: spacing.xs},
  locationDivider: {height: 1, backgroundColor: colors.border, marginVertical: spacing.xs},
  sectionHeader: {
    marginTop: spacing.xxl,
    marginHorizontal: layout.screenPadding,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  shortcutList: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  shortcutCard: {
    width: 220,
    minHeight: 76,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  pinBadge: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFamilyCard: {marginTop: spacing.md, marginHorizontal: layout.screenPadding},
  settingsCard: {marginTop: spacing.md, marginHorizontal: layout.screenPadding},
  settingsRow: {
    minHeight: 86,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingsIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowDivider: {height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg},
  pressed: {opacity: 0.78},
  donationBanner: {
    marginTop: spacing.xl,
    marginHorizontal: layout.screenPadding,
    minHeight: 150,
    backgroundColor: colors.primaryStrong,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  donationCopy: {flex: 1, gap: spacing.sm},
  donationCaption: {opacity: 0.9},
  donationButton: {backgroundColor: colors.surface},
  donationMark: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
});
