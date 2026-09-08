import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useFocusEffect} from '@react-navigation/native';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import type {AppStackParamList} from '../../../app/navigation/types';
import {
  AppButton,
  AppCard,
  AppText,
  Chip,
  ScreenHeader,
  TextField,
} from '../../../components/ui';
import {colors, layout, radius, spacing} from '../../../constants/theme';
import {useAuthStore} from '../../auth/store/authStore';
import {useFamilyStore} from '../../family/store/familyStore';
import {useRoutineStore} from '../store/routineStore';
import type {RoutineDefinition, RoutineDraft} from '../types';
import {
  WEEKDAY_OPTIONS,
  localDateKey,
  routineScheduleLabel,
  validateRoutineDraft,
} from '../utils/schedule';

type Props = NativeStackScreenProps<AppStackParamList, 'MyRoutines'>;

export function MyRoutinesScreen({navigation}: Props) {
  const family = useFamilyStore(state => state.family);
  const session = useAuthStore(state => state.session);
  const routines = useRoutineStore(state => state.routines);
  const isLoading = useRoutineStore(state => state.isLoading);
  const isSaving = useRoutineStore(state => state.isSaving);
  const error = useRoutineStore(state => state.error);
  const load = useRoutineStore(state => state.load);
  const saveRoutine = useRoutineStore(state => state.saveRoutine);
  const removeRoutine = useRoutineStore(state => state.removeRoutine);
  const clearError = useRoutineStore(state => state.clearError);

  const familyId = family?.id ?? null;
  const userId = session?.user.id ?? null;
  const [editor, setEditor] = useState<RoutineDefinition | null | 'new'>(null);

  useFocusEffect(
    useCallback(() => {
      if (familyId) {
        load(familyId, localDateKey(new Date())).catch(() => undefined);
      }
    }, [familyId, load]),
  );

  const ownRoutines = useMemo(
    () =>
      routines
        .filter(item => item.createdBy === userId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [routines, userId],
  );

  const confirmDelete = (routine: RoutineDefinition) => {
    if (!familyId) return;
    Alert.alert(
      'Hapus rutinitas pribadi?',
      `Rutinitas “${routine.title}” dan submission terkait akan dihapus.`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            removeRoutine(familyId, routine.id).catch(() => undefined);
          },
        },
      ],
    );
  };

  const save = async (draft: RoutineDraft) => {
    if (!familyId) return false;
    const routineId = editor === 'new' || editor === null ? null : editor.id;
    const success = await saveRoutine(familyId, routineId, draft);
    if (success) setEditor(null);
    return success;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Rutinitas Saya"
          subtitle="Aktivitas mandiri yang Anda buat dan atur sendiri"
          left={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kembali"
              onPress={() => navigation.goBack()}
              style={styles.backButton}>
              <AppText variant="section" tone="primary">‹</AppText>
            </Pressable>
          }
        />

        <AppCard padding="lg" style={styles.infoCard}>
          <AppText variant="bodyStrong" tone="primary">Kendali tetap aman</AppText>
          <AppText variant="caption" tone="muted">
            Rutinitas yang Anda buat hanya dapat ditugaskan kepada diri sendiri. Kepala Keluarga tetap dapat melihat aktivitas keluarga dan meninjau bukti bila verifikasi diperlukan.
          </AppText>
        </AppCard>

        <View style={styles.sectionHeader}>
          <View style={styles.flexOne}>
            <AppText variant="section">Daftar Rutinitas</AppText>
            <AppText variant="caption" tone="muted">
              {ownRoutines.length} rutinitas dibuat oleh akun Anda
            </AppText>
          </View>
          <AppButton
            label="+ Tambah"
            size="sm"
            fullWidth={false}
            onPress={() => {
              clearError();
              setEditor('new');
            }}
          />
        </View>

        {error ? (
          <AppCard padding="md" style={styles.errorCard}>
            <View style={styles.errorRow}>
              <View style={styles.flexOne}>
                <AppText variant="bodyStrong" tone="danger">Rutinitas belum dapat diproses</AppText>
                <AppText variant="caption" tone="muted">{error}</AppText>
              </View>
              <AppButton
                label="Tutup"
                variant="ghost"
                size="sm"
                fullWidth={false}
                onPress={clearError}
              />
            </View>
          </AppCard>
        ) : null}

        {isLoading && ownRoutines.length === 0 ? (
          <AppCard padding="lg" style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <AppText variant="caption" tone="muted">Memuat rutinitas Anda...</AppText>
          </AppCard>
        ) : ownRoutines.length === 0 ? (
          <AppCard padding="lg" elevated style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <AppText variant="title" tone="primary">✓</AppText>
            </View>
            <AppText variant="section" align="center">Belum ada rutinitas pribadi</AppText>
            <AppText variant="caption" tone="muted" align="center">
              Tambahkan kebiasaan yang ingin Anda bangun, tentukan jadwal dan reward, lalu kerjakan dari halaman Rutinitas.
            </AppText>
            <AppButton label="Buat Rutinitas" onPress={() => setEditor('new')} />
          </AppCard>
        ) : (
          <View style={styles.list}>
            {ownRoutines.map(routine => (
              <AppCard key={routine.id} padding="lg" elevated style={styles.routineCard}>
                <View style={styles.routineTop}>
                  <View style={styles.routineIcon}>
                    <AppText variant="section" tone="primary">✓</AppText>
                  </View>
                  <View style={styles.flexOne}>
                    <AppText variant="bodyStrong">{routine.title}</AppText>
                    <AppText variant="micro" tone="muted">
                      {routineScheduleLabel(routine)}
                    </AppText>
                  </View>
                  <Chip
                    label={routine.isActive ? 'Aktif' : 'Nonaktif'}
                    tone={routine.isActive ? 'success' : 'neutral'}
                  />
                </View>

                {routine.description ? (
                  <AppText variant="caption" tone="secondary">{routine.description}</AppText>
                ) : null}

                <View style={styles.metaRow}>
                  <Chip label={`${routine.rewardPoints} poin`} tone="primary" />
                  <Chip
                    label={routine.proofRequired ? 'Bukti foto' : 'Tanpa foto'}
                    tone="neutral"
                  />
                </View>

                <View style={styles.actions}>
                  <AppButton
                    label="Edit"
                    variant="secondary"
                    size="sm"
                    fullWidth={false}
                    onPress={() => {
                      clearError();
                      setEditor(routine);
                    }}
                  />
                  <AppButton
                    label="Hapus"
                    variant="ghost"
                    size="sm"
                    fullWidth={false}
                    disabled={isSaving}
                    onPress={() => confirmDelete(routine)}
                  />
                </View>
              </AppCard>
            ))}
          </View>
        )}
      </ScrollView>

      <SelfRoutineEditor
        visible={editor !== null}
        routine={editor === 'new' ? null : editor}
        currentUserId={userId}
        saving={isSaving}
        onClose={() => !isSaving && setEditor(null)}
        onSave={save}
      />
    </SafeAreaView>
  );
}

function SelfRoutineEditor({
  visible,
  routine,
  currentUserId,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean;
  routine: RoutineDefinition | null;
  currentUserId: string | null;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: RoutineDraft) => Promise<boolean>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleType, setScheduleType] = useState<'daily' | 'weekly'>('daily');
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [startDate, setStartDate] = useState(localDateKey(new Date()));
  const [endDate, setEndDate] = useState('');
  const [reward, setReward] = useState('10');
  const [proofRequired, setProofRequired] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [validation, setValidation] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setTitle(routine?.title ?? '');
    setDescription(routine?.description ?? '');
    setScheduleType(routine?.scheduleType ?? 'daily');
    setWeekdays(routine?.weekdays ?? []);
    setStartDate(routine?.startDate ?? localDateKey(new Date()));
    setEndDate(routine?.endDate ?? '');
    setReward(String(routine?.rewardPoints ?? 10));
    setProofRequired(routine?.proofRequired ?? true);
    setIsActive(routine?.isActive ?? true);
    setValidation(null);
  }, [routine, visible]);

  const toggleDay = (day: number) => {
    setWeekdays(current =>
      current.includes(day)
        ? current.filter(item => item !== day)
        : [...current, day],
    );
  };

  const submit = async () => {
    if (!currentUserId) {
      setValidation('Sesi pengguna tidak tersedia. Masuk ulang lalu coba lagi.');
      return;
    }

    const draft: RoutineDraft = {
      title,
      description,
      scheduleType,
      weekdays: scheduleType === 'daily' ? [] : weekdays,
      startDate,
      endDate: endDate.trim() || null,
      rewardPoints: Number(reward),
      proofRequired,
      isActive,
      assigneeIds: [currentUserId],
    };
    const issue = validateRoutineDraft(draft);
    if (issue) {
      setValidation(issue);
      return;
    }
    setValidation(null);
    await onSave(draft);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={styles.flexOne}>
              <AppText variant="heading">{routine ? 'Edit Rutinitas' : 'Rutinitas Baru'}</AppText>
              <AppText variant="caption" tone="muted">Rutinitas ini otomatis ditugaskan kepada Anda.</AppText>
            </View>
            <Pressable onPress={onClose} disabled={saving} style={styles.closeButton}>
              <AppText variant="section" tone="secondary">×</AppText>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.editorContent}>
            <TextField
              label="Nama Rutinitas"
              value={title}
              onChangeText={setTitle}
              maxLength={120}
              placeholder="Contoh: Baca buku 20 menit"
            />
            <TextField
              label="Deskripsi (opsional)"
              value={description}
              onChangeText={setDescription}
              maxLength={1000}
              multiline
              inputStyle={styles.multilineInput}
              placeholder="Tambahkan petunjuk atau target singkat"
            />

            <View style={styles.fieldBlock}>
              <AppText variant="label" tone="secondary">Pengulangan</AppText>
              <View style={styles.choiceRow}>
                <Choice
                  active={scheduleType === 'daily'}
                  label="Setiap hari"
                  onPress={() => setScheduleType('daily')}
                />
                <Choice
                  active={scheduleType === 'weekly'}
                  label="Hari tertentu"
                  onPress={() => setScheduleType('weekly')}
                />
              </View>
            </View>

            {scheduleType === 'weekly' ? (
              <View style={styles.weekdayRow}>
                {WEEKDAY_OPTIONS.map(option => (
                  <Pressable
                    key={option.value}
                    onPress={() => toggleDay(option.value)}
                    style={[
                      styles.weekdayChip,
                      weekdays.includes(option.value) ? styles.weekdayChipActive : undefined,
                    ]}>
                    <AppText
                      variant="micro"
                      tone={weekdays.includes(option.value) ? 'primary' : 'muted'}>
                      {option.label}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <View style={styles.dateRow}>
              <TextField
                label="Mulai"
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                containerStyle={styles.flexOne}
              />
              <TextField
                label="Selesai"
                value={endDate}
                onChangeText={setEndDate}
                placeholder="Opsional"
                containerStyle={styles.flexOne}
              />
            </View>

            <TextField
              label="Poin Hadiah"
              value={reward}
              onChangeText={setReward}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="0"
              helperText="Reward ditentukan untuk memotivasi rutinitas pribadi Anda."
            />

            <View style={styles.switchCard}>
              <View style={styles.flexOne}>
                <AppText variant="bodyStrong">Wajib bukti foto</AppText>
                <AppText variant="caption" tone="muted">Jika aktif, penyelesaian harus dikirim untuk persetujuan Head.</AppText>
              </View>
              <Switch
                value={proofRequired}
                onValueChange={setProofRequired}
                trackColor={{false: colors.border, true: colors.primaryMuted}}
                thumbColor={proofRequired ? colors.primary : '#FFFFFF'}
              />
            </View>

            <View style={styles.switchCard}>
              <View style={styles.flexOne}>
                <AppText variant="bodyStrong">Rutinitas aktif</AppText>
                <AppText variant="caption" tone="muted">Nonaktifkan tanpa menghapus riwayat rutinitas.</AppText>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{false: colors.border, true: colors.primaryMuted}}
                thumbColor={isActive ? colors.primary : '#FFFFFF'}
              />
            </View>

            {validation ? (
              <AppCard padding="md" style={styles.validationCard}>
                <AppText variant="caption" tone="danger">{validation}</AppText>
              </AppCard>
            ) : null}

            <AppButton
              label={routine ? 'Simpan Perubahan' : 'Simpan Rutinitas'}
              loading={saving}
              onPress={() => submit().catch(() => undefined)}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Choice({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.choice, active ? styles.choiceActive : undefined]}>
      <AppText variant="label" tone={active ? 'primary' : 'muted'}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: 80,
    gap: spacing.xl,
  },
  flexOne: {flex: 1},
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    gap: spacing.xs,
  },
  sectionHeader: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  errorCard: {backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.danger},
  errorRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  loadingCard: {alignItems: 'center', gap: spacing.sm},
  emptyCard: {alignItems: 'center', gap: spacing.md},
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {gap: spacing.md},
  routineCard: {gap: spacing.md},
  routineTop: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  routineIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  actions: {flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm},
  modalBackdrop: {flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay},
  modalSheet: {
    maxHeight: '94%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.surface,
    paddingTop: spacing.sm,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorContent: {paddingHorizontal: spacing.xl, paddingBottom: 44, gap: spacing.lg},
  multilineInput: {minHeight: 82, paddingTop: spacing.md, textAlignVertical: 'top'},
  fieldBlock: {gap: spacing.sm},
  choiceRow: {flexDirection: 'row', gap: spacing.sm},
  choice: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceActive: {backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary},
  weekdayRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  weekdayChip: {
    minWidth: 42,
    minHeight: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayChipActive: {backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary},
  dateRow: {flexDirection: 'row', gap: spacing.sm},
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
  },
  validationCard: {backgroundColor: colors.dangerSoft},
});
