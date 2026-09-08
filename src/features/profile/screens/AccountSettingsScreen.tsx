import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import type {AppStackParamList} from '../../../app/navigation/types';
import {
  AppButton,
  AppCard,
  AppText,
  Avatar,
  ScreenHeader,
  TextField,
} from '../../../components/ui';
import {colors, layout, radius, spacing} from '../../../constants/theme';
import {useAuthStore} from '../../auth/store/authStore';
import {useFamilyStore} from '../../family/store/familyStore';
import {useProfileStore} from '../store/profileStore';
import {normalizePhoneNumber} from '../utils/profile';

type Props = NativeStackScreenProps<AppStackParamList, 'AccountSettings'>;

export function AccountSettingsScreen({navigation}: Props) {
  const session = useAuthStore(state => state.session);
  const family = useFamilyStore(state => state.family);
  const profile = useProfileStore(state => state.profile);
  const isLoading = useProfileStore(state => state.isLoading);
  const isSaving = useProfileStore(state => state.isSaving);
  const error = useProfileStore(state => state.error);
  const load = useProfileStore(state => state.load);
  const save = useProfileStore(state => state.save);
  const clearError = useProfileStore(state => state.clearError);

  const fallbackName = useMemo(() => {
    const metadataName = session?.user.user_metadata?.full_name;
    if (typeof metadataName === 'string' && metadataName.trim()) return metadataName.trim();
    return session?.user.email?.split('@')[0] ?? 'Pengguna DiaryQu';
  }, [session]);

  const [fullName, setFullName] = useState(profile?.fullName ?? fallbackName);
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber ?? '');

  useEffect(() => {
    if (!profile && !isLoading) load().catch(() => undefined);
  }, [isLoading, load, profile]);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName);
    setPhoneNumber(profile.phoneNumber ?? '');
  }, [profile]);

  const submit = async () => {
    const ok = await save({
      fullName,
      phoneNumber: normalizePhoneNumber(phoneNumber),
    });
    if (ok) {
      Alert.alert('Profil diperbarui', 'Perubahan data akun sudah disimpan.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Pengaturan Akun"
          subtitle="Kelola identitas pribadi yang tampil di DiaryQu."
          variant="primary"
          left={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kembali"
              hitSlop={8}
              onPress={() => navigation.goBack()}
              style={styles.backButton}>
              <AppText variant="section" tone="onPrimary">‹</AppText>
            </Pressable>
          }
        />

        <AppCard padding="lg" elevated style={styles.identityCard}>
          <Avatar name={profile?.fullName ?? fallbackName} size="lg" />
          <View style={styles.flexOne}>
            <AppText variant="section">{profile?.fullName ?? fallbackName}</AppText>
            <AppText variant="caption" tone="muted">
              {family?.role === 'head' ? 'Kepala Keluarga' : 'Anggota Keluarga'}
            </AppText>
            <AppText variant="micro" tone="muted" numberOfLines={1}>
              {profile?.email ?? session?.user.email ?? 'Email tidak tersedia'}
            </AppText>
          </View>
        </AppCard>

        <View style={styles.sectionCopy}>
          <AppText variant="section">Data pribadi</AppText>
          <AppText variant="caption" tone="muted">
            Nama yang disimpan di sini akan digunakan di profil dan header aplikasi.
          </AppText>
        </View>

        <AppCard padding="lg" style={styles.formCard}>
          <TextField
            label="Nama lengkap"
            value={fullName}
            onChangeText={value => {
              clearError();
              setFullName(value);
            }}
            placeholder="Nama lengkap"
            autoCapitalize="words"
            maxLength={100}
          />
          <TextField
            label="Nomor telepon"
            value={phoneNumber}
            onChangeText={value => {
              clearError();
              setPhoneNumber(value);
            }}
            placeholder="Contoh: +62 812 3456 7890"
            keyboardType="phone-pad"
            maxLength={24}
            helperText="Opsional. Hanya terlihat oleh anggota Family Room yang sama."
          />
          <TextField
            label="Email akun"
            value={profile?.email ?? session?.user.email ?? ''}
            editable={false}
            helperText="Email login tidak diubah dari halaman ini."
          />

          {error ? (
            <AppCard padding="sm" style={styles.errorCard}>
              <AppText variant="caption" tone="danger">{error}</AppText>
            </AppCard>
          ) : null}

          <AppButton
            label="Simpan Perubahan"
            onPress={submit}
            loading={isSaving}
            disabled={isLoading}
            size="lg"
          />
        </AppCard>

        <AppCard padding="lg" style={styles.securityCard}>
          <View style={styles.securityIcon}>
            <AppText variant="section" tone="primary">✓</AppText>
          </View>
          <View style={styles.flexOne}>
            <AppText variant="bodyStrong">Privasi akun</AppText>
            <AppText variant="caption" tone="muted">
              Data profil hanya dapat diubah oleh pemilik akun. Informasi anggota tetap dibatasi oleh Family Room dan RLS Supabase.
            </AppText>
          </View>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.jumbo,
    gap: spacing.lg,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCard: {flexDirection: 'row', alignItems: 'center', gap: spacing.lg},
  flexOne: {flex: 1},
  sectionCopy: {gap: spacing.xs, marginTop: spacing.sm},
  formCard: {gap: spacing.lg},
  errorCard: {backgroundColor: colors.dangerSoft},
  securityCard: {flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start'},
  securityIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
