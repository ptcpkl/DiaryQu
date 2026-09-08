import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import type {AppStackParamList} from '../../../app/navigation/types';
import {
  AppButton,
  AppCard,
  AppText,
  Avatar,
  Chip,
  ScreenHeader,
  TextField,
} from '../../../components/ui';
import {colors, layout, radius, spacing} from '../../../constants/theme';
import {useAuthStore} from '../../auth/store/authStore';
import {useFamilyStore} from '../store/familyStore';
import type {FamilyMember} from '../types';
import {
  formatJoinedDate,
  sortFamilyMembers,
  validateFamilyName,
} from '../utils/family';

type Props = NativeStackScreenProps<AppStackParamList, 'FamilyInfo'>;

export function FamilyInfoScreen({navigation}: Props) {
  const session = useAuthStore(state => state.session);
  const family = useFamilyStore(state => state.family);
  const members = useFamilyStore(state => state.members);
  const memberStatus = useFamilyStore(state => state.memberStatus);
  const isManaging = useFamilyStore(state => state.isManaging);
  const error = useFamilyStore(state => state.error);
  const loadMembers = useFamilyStore(state => state.loadMembers);
  const renameFamily = useFamilyStore(state => state.renameFamily);
  const regenerateFamilyCode = useFamilyStore(state => state.regenerateFamilyCode);
  const removeMember = useFamilyStore(state => state.removeMember);
  const transferHead = useFamilyStore(state => state.transferHead);
  const leaveFamily = useFamilyStore(state => state.leaveFamily);
  const clearError = useFamilyStore(state => state.clearError);

  const [editingName, setEditingName] = useState(false);
  const [familyName, setFamilyName] = useState(family?.name ?? '');
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (memberStatus === 'idle') loadMembers().catch(() => undefined);
  }, [loadMembers, memberStatus]);

  useEffect(() => {
    setFamilyName(family?.name ?? '');
  }, [family?.name]);

  const sortedMembers = useMemo(() => sortFamilyMembers(members), [members]);
  const currentUserId = session?.user.id ?? null;
  const isHead = family?.role === 'head';

  const shareFamilyCode = async () => {
    if (!family) return;
    await Share.share({
      message: `Gabung ke ${family.name} di DiaryQu dengan Family Code: ${family.familyCode}`,
      title: 'Family Code DiaryQu',
    });
  };

  const saveName = async () => {
    const validation = validateFamilyName(familyName);
    if (validation) {
      setNameError(validation);
      return;
    }
    const ok = await renameFamily(familyName);
    if (ok) setEditingName(false);
  };

  const confirmRegenerateCode = () => {
    Alert.alert(
      'Buat Family Code baru?',
      'Kode lama langsung tidak dapat digunakan untuk bergabung. Anggota yang sudah ada tetap berada di Family Room.',
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Buat Kode Baru',
          onPress: () => regenerateFamilyCode().catch(() => undefined),
        },
      ],
    );
  };

  const confirmRemoveMember = (member: FamilyMember) => {
    Alert.alert(
      'Keluarkan anggota?',
      `${member.fullName} akan kehilangan akses ke Family Room ini. Riwayat yang sudah tercatat tetap dipertahankan.`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Keluarkan',
          style: 'destructive',
          onPress: () => removeMember(member.id).catch(() => undefined),
        },
      ],
    );
  };

  const confirmTransferHead = (member: FamilyMember) => {
    Alert.alert(
      'Pindahkan peran Kepala Keluarga?',
      `${member.fullName} akan menjadi Kepala Keluarga. Peran Anda berubah menjadi Anggota Keluarga.`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Pindahkan Peran',
          onPress: async () => {
            const ok = await transferHead(member.id);
            if (ok) {
              Alert.alert('Peran dipindahkan', `${member.fullName} sekarang menjadi Kepala Keluarga.`);
            }
          },
        },
      ],
    );
  };

  const confirmLeaveFamily = () => {
    Alert.alert(
      'Keluar dari Family Room?',
      'Anda tidak lagi dapat melihat data keluarga ini setelah keluar. Untuk bergabung kembali diperlukan Family Code yang aktif.',
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Keluar Family Room',
          style: 'destructive',
          onPress: () => leaveFamily().catch(() => undefined),
        },
      ],
    );
  };

  if (!family) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <AppText variant="heading">Family Room tidak tersedia</AppText>
          <AppText variant="bodySmall" tone="muted" align="center">
            Kembali ke proses setup untuk membuat atau bergabung ke Family Room.
          </AppText>
          <AppButton label="Kembali" onPress={() => navigation.goBack()} fullWidth={false} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Informasi Keluarga"
          subtitle="Kelola Family Room, kode akses, anggota, dan peran."
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

        <AppCard padding="lg" elevated style={styles.roomCard}>
          <View style={styles.roomTop}>
            <View style={styles.roomIcon}>
              <AppText variant="heading" tone="primary">⌂</AppText>
            </View>
            <View style={styles.flexOne}>
              <AppText variant="micro" tone="muted">FAMILY ROOM</AppText>
              <AppText variant="heading">{family.name}</AppText>
              <AppText variant="caption" tone="muted">
                {isHead ? 'Anda adalah Kepala Keluarga' : 'Anda adalah Anggota Keluarga'}
              </AppText>
            </View>
            <Chip label={isHead ? 'Head' : 'Member'} tone={isHead ? 'success' : 'primary'} />
          </View>

          <View style={styles.codeCard}>
            <View style={styles.flexOne}>
              <AppText variant="micro" tone="muted">FAMILY CODE</AppText>
              <AppText variant="title" tone="primary">{family.familyCode}</AppText>
              <AppText variant="caption" tone="muted">
                Bagikan kode ini hanya kepada anggota keluarga yang ingin diundang.
              </AppText>
            </View>
            <AppButton
              label="Bagikan"
              variant="secondary"
              size="sm"
              fullWidth={false}
              onPress={shareFamilyCode}
            />
          </View>

          {isHead ? (
            <View style={styles.roomActions}>
              <AppButton
                label={editingName ? 'Batal Edit Nama' : 'Ubah Nama Keluarga'}
                variant="outline"
                size="sm"
                fullWidth={false}
                onPress={() => {
                  setNameError(null);
                  setFamilyName(family.name);
                  setEditingName(value => !value);
                }}
              />
              <AppButton
                label="Ganti Family Code"
                variant="ghost"
                size="sm"
                fullWidth={false}
                disabled={isManaging}
                onPress={confirmRegenerateCode}
              />
            </View>
          ) : null}

          {editingName ? (
            <View style={styles.renameBox}>
              <TextField
                label="Nama Family Room"
                value={familyName}
                onChangeText={value => {
                  setFamilyName(value);
                  setNameError(null);
                  clearError();
                }}
                error={nameError ?? undefined}
                maxLength={100}
                autoCapitalize="words"
              />
              <AppButton
                label="Simpan Nama"
                onPress={saveName}
                loading={isManaging}
                size="md"
              />
            </View>
          ) : null}
        </AppCard>

        {error ? (
          <AppCard padding="md" style={styles.errorCard}>
            <View style={styles.errorRow}>
              <View style={styles.flexOne}>
                <AppText variant="bodyStrong" tone="danger">Pengaturan belum dapat diproses</AppText>
                <AppText variant="caption" tone="muted">{error}</AppText>
              </View>
              <Pressable onPress={clearError} hitSlop={8}>
                <AppText variant="label" tone="primary">Tutup</AppText>
              </Pressable>
            </View>
          </AppCard>
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <AppText variant="section">Anggota Keluarga</AppText>
            <AppText variant="caption" tone="muted">
              {members.length} akun tergabung di Family Room ini.
            </AppText>
          </View>
          <Pressable onPress={() => loadMembers()} hitSlop={8}>
            <AppText variant="label" tone="primary">Muat ulang</AppText>
          </Pressable>
        </View>

        {memberStatus === 'loading' && members.length === 0 ? (
          <AppCard padding="lg" style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <AppText variant="caption" tone="muted">Memuat anggota keluarga...</AppText>
          </AppCard>
        ) : null}

        <View style={styles.memberStack}>
          {sortedMembers.map(member => {
            const isMe = member.id === currentUserId;
            const canManageMember = isHead && !isMe && member.role === 'member';
            return (
              <AppCard key={member.id} padding="md" style={styles.memberCard}>
                <View style={styles.memberMain}>
                  <Avatar name={member.fullName} size="md" />
                  <View style={styles.flexOne}>
                    <View style={styles.memberNameRow}>
                      <AppText variant="bodyStrong" numberOfLines={1}>{member.fullName}</AppText>
                      {isMe ? <Chip label="Anda" tone="primary" /> : null}
                    </View>
                    <AppText variant="caption" tone="muted">
                      {member.role === 'head' ? 'Kepala Keluarga' : 'Anggota Keluarga'} · {formatJoinedDate(member.joinedAt)}
                    </AppText>
                    {member.phoneNumber ? (
                      <AppText variant="micro" tone="muted">{member.phoneNumber}</AppText>
                    ) : null}
                  </View>
                  <Chip
                    label={member.role === 'head' ? 'Head' : 'Member'}
                    tone={member.role === 'head' ? 'success' : 'neutral'}
                  />
                </View>

                {canManageMember ? (
                  <View style={styles.memberActions}>
                    <Pressable
                      disabled={isManaging}
                      onPress={() => confirmTransferHead(member)}
                      style={styles.memberActionButton}>
                      <AppText variant="label" tone="primary">Jadikan Kepala</AppText>
                    </Pressable>
                    <Pressable
                      disabled={isManaging}
                      onPress={() => confirmRemoveMember(member)}
                      style={styles.memberActionButton}>
                      <AppText variant="label" tone="danger">Keluarkan</AppText>
                    </Pressable>
                  </View>
                ) : null}
              </AppCard>
            );
          })}
        </View>

        <AppCard padding="lg" style={styles.accessCard}>
          <View style={styles.accessIcon}>
            <AppText variant="section" tone="primary">✓</AppText>
          </View>
          <View style={styles.flexOne}>
            <AppText variant="bodyStrong">Akses berbasis peran</AppText>
            <AppText variant="caption" tone="muted">
              Head mengelola room, keuangan, dan approval. Member tidak dapat menaikkan perannya sendiri; perubahan peran selalu diverifikasi backend.
            </AppText>
          </View>
        </AppCard>

        {isHead ? (
          <AppCard padding="lg" style={styles.headNoteCard}>
            <AppText variant="bodyStrong">Ingin keluar dari Family Room?</AppText>
            <AppText variant="caption" tone="muted">
              Sebagai Head, pindahkan dulu peran Kepala Keluarga ke anggota lain agar Family Room tidak kehilangan pengelola.
            </AppText>
          </AppCard>
        ) : (
          <AppButton
            label="Keluar dari Family Room"
            variant="danger"
            onPress={confirmLeaveFamily}
            loading={isManaging}
            size="lg"
          />
        )}
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
  centerState: {
    flex: 1,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
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
  roomCard: {gap: spacing.lg},
  roomTop: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  roomIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexOne: {flex: 1},
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  roomActions: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  renameBox: {gap: spacing.md},
  errorCard: {backgroundColor: colors.dangerSoft},
  errorRow: {flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md},
  sectionHeader: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  loadingCard: {alignItems: 'center', gap: spacing.md},
  memberStack: {gap: spacing.md},
  memberCard: {gap: spacing.md},
  memberMain: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  memberNameRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  memberActions: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    flexDirection: 'row',
    gap: spacing.lg,
  },
  memberActionButton: {minHeight: 32, justifyContent: 'center'},
  accessCard: {flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start'},
  accessIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headNoteCard: {backgroundColor: colors.warningSoft, gap: spacing.xs},
});
