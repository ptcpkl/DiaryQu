import {useFocusEffect} from '@react-navigation/native';
import React, {useCallback, useMemo, useState} from 'react';
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
  useWindowDimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {BrandMark} from '../../../components/common/BrandMark';
import {
  AppButton,
  AppCard,
  AppText,
  Avatar,
  Chip,
  FloatingActionButton,
  IconBadge,
  ScreenHeader,
  SectionHeader,
  TextField,
} from '../../../components/ui';
import {
  colors,
  layout,
  radius,
  shadows,
  spacing,
} from '../../../constants/theme';
import {useAuthStore} from '../../auth/store/authStore';
import {useFamilyStore} from '../../family/store/familyStore';
import {agendaReminderService} from '../services/agendaReminderService';
import {useAgendaStore} from '../store/agendaStore';
import type {
  AgendaCategory,
  AgendaDraft,
  AgendaEntry,
  AgendaStatus,
} from '../types';
import {
  calendarCells,
  dateKey,
  formatShortDate,
  formatTime,
  monthRange,
} from '../utils/date';
import {
  REMINDER_OPTIONS,
  agendaEditorInitialState,
  buildAgendaDraft,
  type AgendaEditorValues,
} from '../utils/editor';

const WEEKDAYS = ['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'];

const STATUS_META: Record<
  AgendaStatus,
  {label: string; tone: 'primary' | 'warning' | 'success'; glyph: string}
> = {
  scheduled: {label: 'Terjadwal', tone: 'primary', glyph: '•'},
  postponed: {label: 'Ditunda', tone: 'warning', glyph: 'Ⅱ'},
  completed: {label: 'Selesai', tone: 'success', glyph: '✓'},
};

const CATEGORY_META: Record<
  AgendaCategory,
  {label: string; tone: 'primary' | 'warning' | 'success'; glyph: string}
> = {
  work: {label: 'Kerja', tone: 'primary', glyph: '▣'},
  business: {label: 'Bisnis', tone: 'warning', glyph: '◇'},
  islamic: {label: 'Islami', tone: 'success', glyph: '☾'},
};

const CATEGORY_OPTIONS = Object.keys(CATEGORY_META) as AgendaCategory[];
const STATUS_OPTIONS = Object.keys(STATUS_META) as AgendaStatus[];

function displayNameFromSession(
  session: ReturnType<typeof useAuthStore.getState>['session'],
): string {
  const metadata = session?.user.user_metadata;
  if (
    metadata &&
    typeof metadata.full_name === 'string' &&
    metadata.full_name.trim()
  ) {
    return metadata.full_name.trim();
  }
  return session?.user.email?.split('@')[0] ?? 'DiaryQu';
}

export function AgendaScreen() {
  const family = useFamilyStore(state => state.family);
  const session = useAuthStore(state => state.session);
  const items = useAgendaStore(state => state.items);
  const isLoading = useAgendaStore(state => state.isLoading);
  const isSaving = useAgendaStore(state => state.isSaving);
  const error = useAgendaStore(state => state.error);
  const reminderIsExact = useAgendaStore(state => state.reminderIsExact);
  const loadRange = useAgendaStore(state => state.loadRange);
  const createEntry = useAgendaStore(state => state.createEntry);
  const updateEntry = useAgendaStore(state => state.updateEntry);
  const removeEntry = useAgendaStore(state => state.removeEntry);
  const refreshExactAlarmStatus = useAgendaStore(
    state => state.refreshExactAlarmStatus,
  );
  const clearError = useAgendaStore(state => state.clearError);

  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [editorEntry, setEditorEntry] = useState<AgendaEntry | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const familyId = family?.id ?? null;
  const userId = session?.user.id ?? null;
  const range = useMemo(() => monthRange(visibleMonth), [visibleMonth]);
  const cells = useMemo(() => calendarCells(visibleMonth), [visibleMonth]);
  const selectedKey = dateKey(selectedDate);
  const todayKey = dateKey(new Date());
  const displayName = displayNameFromSession(session);

  const eventCounts = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach(item => {
      const key = dateKey(new Date(item.startsAt));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [items]);

  const selectedItems = useMemo(
    () =>
      items.filter(item => dateKey(new Date(item.startsAt)) === selectedKey),
    [items, selectedKey],
  );

  const activeMonthCount = items.filter(item => item.status !== 'completed').length;
  const reminderCount = items.filter(item => item.reminderEnabled).length;

  useFocusEffect(
    useCallback(() => {
      if (familyId) {
        loadRange(familyId, range.startIso, range.endIso).catch(() => undefined);
      }
      refreshExactAlarmStatus().catch(() => undefined);
    }, [
      familyId,
      loadRange,
      range.endIso,
      range.startIso,
      refreshExactAlarmStatus,
    ]),
  );

  const changeMonth = (delta: number) => {
    const next = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + delta,
      1,
    );
    setVisibleMonth(next);
    setSelectedDate(next);
    clearError();
  };

  const goToday = () => {
    const today = new Date();
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
    clearError();
  };

  const openCreate = () => {
    setEditorEntry(null);
    setEditorOpen(true);
    clearError();
  };

  const openEdit = (entry: AgendaEntry) => {
    setEditorEntry(entry);
    const entryDate = new Date(entry.startsAt);
    setSelectedDate(entryDate);
    setVisibleMonth(
      new Date(entryDate.getFullYear(), entryDate.getMonth(), 1),
    );
    setEditorOpen(true);
    clearError();
  };

  const reloadCurrentMonth = async () => {
    if (familyId) {
      await loadRange(familyId, range.startIso, range.endIso);
    }
  };

  const saveAgenda = async (draft: AgendaDraft): Promise<boolean> => {
    if (!familyId || !userId) {
      return false;
    }

    const saved = editorEntry
      ? await updateEntry(editorEntry.id, draft)
      : await createEntry(familyId, userId, draft);

    if (!saved) {
      return false;
    }

    setEditorOpen(false);
    setEditorEntry(null);
    await reloadCurrentMonth();
    return true;
  };

  const confirmDelete = (entry: AgendaEntry) => {
    Alert.alert(
      'Hapus agenda?',
      `Agenda “${entry.title}” akan dihapus permanen.`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            removeEntry(entry.id)
              .then(success => {
                if (success) {
                  reloadCurrentMonth().catch(() => undefined);
                }
              })
              .catch(() => undefined);
          },
        },
      ],
    );
  };

  const canManage = (entry: AgendaEntry) =>
    entry.createdBy === userId || family?.role === 'head';

  const monthLabel = new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(visibleMonth);

  const selectedDateLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(selectedDate);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <BrandMark compact />
          <View style={styles.identityRow}>
            <View style={styles.identityCopy}>
              <AppText variant="bodyStrong" numberOfLines={1} align="right">
                {displayName}
              </AppText>
              <AppText variant="micro" tone="muted" align="right">
                {family?.role === 'head'
                  ? 'Kepala Keluarga'
                  : 'Anggota Keluarga'}
              </AppText>
            </View>
            <Avatar name={displayName} size="md" />
          </View>
        </View>

        <ScreenHeader
          variant="primary"
          title="Agenda"
          subtitle="Susun jadwal keluarga dan dapatkan pengingat tepat waktu."
          right={
            <View style={styles.heroIcon}>
              <AppText variant="heading" tone="onPrimary">
                ▦
              </AppText>
            </View>
          }
        />

        <View style={styles.summaryRow}>
          <SummaryCard
            glyph="▦"
            label="Aktif bulan ini"
            value={String(activeMonthCount)}
          />
          <SummaryCard
            glyph="◉"
            label="Reminder aktif"
            value={String(reminderCount)}
          />
        </View>

        {reminderIsExact === false ? (
          <View style={styles.permissionCard}>
            <IconBadge glyph="!" tone="warning" size="sm" />
            <View style={styles.permissionCopy}>
              <AppText variant="bodyStrong" tone="warning">
                Alarm presisi belum aktif
              </AppText>
              <AppText variant="caption" tone="muted">
                Reminder tetap berjalan, tetapi Android dapat sedikit menggeser
                waktunya.
              </AppText>
            </View>
            <AppButton
              label="Aktifkan"
              variant="ghost"
              size="sm"
              fullWidth={false}
              onPress={() => {
                agendaReminderService
                  .openExactAlarmSettings()
                  .catch(() => undefined);
              }}
            />
          </View>
        ) : null}

        <AppCard elevated padding="lg" style={styles.calendarCard}>
          <View style={styles.calendarTitleRow}>
            <View>
              <AppText variant="section" style={styles.monthLabel}>
                {monthLabel}
              </AppText>
              <AppText variant="micro" tone="muted">
                Pilih tanggal untuk melihat jadwal
              </AppText>
            </View>
            <AppButton
              label="Hari ini"
              variant="secondary"
              size="sm"
              fullWidth={false}
              onPress={goToday}
            />
          </View>

          <View style={styles.monthNavigation}>
            <MonthArrow label="‹" onPress={() => changeMonth(-1)} />
            <View style={styles.monthNavigationLine} />
            <MonthArrow label="›" onPress={() => changeMonth(1)} />
          </View>

          <View style={styles.weekHeader}>
            {WEEKDAYS.map(day => (
              <AppText
                key={day}
                variant="micro"
                tone="subtle"
                align="center"
                style={styles.weekday}>
                {day}
              </AppText>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {cells.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const key = dateKey(date);
              const selected = key === selectedKey;
              const today = key === todayKey;
              const count = eventCounts.get(key) ?? 0;

              return (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={`Tanggal ${date.getDate()}, ${count} agenda`}
                  accessibilityState={{selected}}
                  onPress={() => setSelectedDate(date)}
                  style={({pressed}) => [
                    styles.dayCell,
                    selected ? styles.dayCellSelected : undefined,
                    today && !selected ? styles.dayCellToday : undefined,
                    pressed ? styles.dayCellPressed : undefined,
                  ]}>
                  <AppText
                    variant={selected ? 'bodyStrong' : 'bodySmall'}
                    tone={selected ? 'onPrimary' : 'default'}>
                    {date.getDate()}
                  </AppText>
                  {count > 0 ? (
                    <View style={styles.dayEventRow}>
                      <View
                        style={[
                          styles.eventDot,
                          selected ? styles.eventDotSelected : undefined,
                        ]}
                      />
                      {count > 1 ? (
                        <AppText
                          variant="micro"
                          tone={selected ? 'onPrimary' : 'primary'}>
                          {count}
                        </AppText>
                      ) : null}
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </AppCard>

        <View style={styles.sectionBlock}>
          <SectionHeader
            title="Jadwal"
            subtitle={selectedDateLabel}
            actionLabel="+ Tambah"
            onAction={openCreate}
          />

          {error ? (
            <View style={styles.errorCard}>
              <IconBadge glyph="!" tone="danger" size="sm" />
              <AppText variant="caption" tone="danger" style={styles.flexOne}>
                {error}
              </AppText>
              <AppButton
                label="Tutup"
                variant="ghost"
                size="sm"
                fullWidth={false}
                onPress={clearError}
              />
            </View>
          ) : null}

          {isLoading ? (
            <AppCard padding="lg" style={styles.loadingCard}>
              <ActivityIndicator color={colors.primary} />
              <AppText variant="caption" tone="muted">
                Memuat agenda...
              </AppText>
            </AppCard>
          ) : selectedItems.length === 0 ? (
            <AppCard elevated padding="lg" style={styles.emptyCard}>
              <IconBadge glyph="▦" tone="primary" size="lg" />
              <AppText variant="section" align="center">
                Belum ada agenda
              </AppText>
              <AppText variant="caption" tone="muted" align="center">
                Tambahkan jadwal untuk tanggal ini. Agenda hanya berfungsi
                sebagai pengingat dan tidak membutuhkan bukti atau persetujuan.
              </AppText>
              <AppButton
                label="Buat Agenda"
                size="md"
                onPress={openCreate}
                style={styles.emptyButton}
              />
            </AppCard>
          ) : (
            <View style={styles.agendaList}>
              {selectedItems.map(entry => (
                <AgendaCard
                  key={entry.id}
                  entry={entry}
                  canManage={canManage(entry)}
                  onEdit={() => openEdit(entry)}
                  onDelete={() => confirmDelete(entry)}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.reminderInfoCard}>
          <IconBadge glyph="◉" tone="info" size="sm" />
          <View style={styles.flexOne}>
            <AppText variant="bodyStrong">Pengingat Agenda</AppText>
            <AppText variant="caption" tone="muted">
              Notifikasi dibuat langsung di perangkat. Kamu bisa menunda 5
              menit atau menutup reminder dari notifikasi Android.
            </AppText>
          </View>
        </View>
      </ScrollView>

      <FloatingActionButton
        accessibilityLabel="Tambah agenda"
        label="Agenda"
        extended
        onPress={openCreate}
        style={styles.fab}
      />

      <AgendaEditorModal
        visible={editorOpen}
        selectedDate={selectedDate}
        entry={editorEntry}
        saving={isSaving}
        onClose={() => {
          if (!isSaving) {
            setEditorOpen(false);
            setEditorEntry(null);
          }
        }}
        onSave={saveAgenda}
      />
    </SafeAreaView>
  );
}

function SummaryCard({
  glyph,
  label,
  value,
}: {
  glyph: string;
  label: string;
  value: string;
}) {
  return (
    <AppCard elevated padding="md" style={styles.summaryCard}>
      <IconBadge glyph={glyph} tone="primary" size="sm" />
      <View style={styles.flexOne}>
        <AppText variant="heading" tone="primary">
          {value}
        </AppText>
        <AppText variant="micro" tone="muted">
          {label}
        </AppText>
      </View>
    </AppCard>
  );
}

function MonthArrow({label, onPress}: {label: string; onPress: () => void}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label === '‹' ? 'Bulan sebelumnya' : 'Bulan berikutnya'}
      onPress={onPress}
      style={({pressed}) => [
        styles.monthArrow,
        pressed ? styles.monthArrowPressed : undefined,
      ]}>
      <AppText variant="heading" tone="primary" style={styles.monthArrowText}>
        {label}
      </AppText>
    </Pressable>
  );
}

function AgendaCard({
  entry,
  canManage,
  onEdit,
  onDelete,
}: {
  entry: AgendaEntry;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const statusMeta = STATUS_META[entry.status];
  const categoryMeta = CATEGORY_META[entry.category ?? 'work'];

  return (
    <AppCard elevated padding="none" style={styles.agendaCard}>
      <View style={styles.agendaAccent} />
      <View style={styles.agendaBody}>
        <View style={styles.agendaBadgeRow}>
          <View style={styles.badgeWrap}>
            <Chip label={categoryMeta.label} tone={categoryMeta.tone} />
            <Chip label={statusMeta.label} tone={statusMeta.tone} leadingDot />
          </View>
          {canManage ? (
            <View style={styles.cardActions}>
              <Pressable
                accessibilityRole="button"
                onPress={onEdit}
                style={styles.cardAction}>
                <AppText variant="label" tone="primary">
                  Edit
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={onDelete}
                style={styles.cardAction}>
                <AppText variant="label" tone="danger">
                  Hapus
                </AppText>
              </Pressable>
            </View>
          ) : null}
        </View>

        <AppText variant="section" style={styles.agendaTitle}>
          {entry.title}
        </AppText>

        <View style={styles.agendaMetaList}>
          <MetaLine
            glyph="◷"
            text={`${formatTime(entry.startsAt)}${
              entry.endsAt ? ` – ${formatTime(entry.endsAt)}` : ''
            }`}
          />
          {entry.location ? <MetaLine glyph="⌖" text={entry.location} /> : null}
        </View>

        {entry.notes ? (
          <View style={styles.notesBox}>
            <AppText variant="caption" tone="secondary">
              {entry.notes}
            </AppText>
          </View>
        ) : null}

        <View style={styles.reminderLine}>
          <IconBadge
            glyph={entry.reminderEnabled ? '◉' : '○'}
            tone={entry.reminderEnabled ? 'primary' : 'neutral'}
            size="sm"
          />
          <View style={styles.flexOne}>
            <AppText variant="label" tone={entry.reminderEnabled ? 'primary' : 'muted'}>
              {entry.reminderEnabled && entry.reminderAt
                ? `Reminder ${formatShortDate(entry.reminderAt)} · ${formatTime(
                    entry.reminderAt,
                  )}`
                : 'Reminder tidak aktif'}
            </AppText>
            <AppText variant="micro" tone="muted">
              {entry.reminderEnabled
                ? 'Notifikasi lokal Android'
                : 'Aktifkan saat mengedit agenda jika diperlukan'}
            </AppText>
          </View>
        </View>
      </View>
    </AppCard>
  );
}

function MetaLine({glyph, text}: {glyph: string; text: string}) {
  return (
    <View style={styles.metaLine}>
      <AppText variant="caption" tone="primary" style={styles.metaGlyph}>
        {glyph}
      </AppText>
      <AppText variant="caption" tone="muted" style={styles.flexOne}>
        {text}
      </AppText>
    </View>
  );
}

function AgendaEditorModal({
  visible,
  selectedDate,
  entry,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean;
  selectedDate: Date;
  entry: AgendaEntry | null;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: AgendaDraft) => Promise<boolean>;
}) {
  const {width} = useWindowDimensions();
  const compact = width < 370;
  const initial = useMemo(
    () => agendaEditorInitialState(selectedDate, entry),
    [entry, selectedDate],
  );
  const [values, setValues] = useState<AgendaEditorValues>(initial);
  const [validation, setValidation] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setValues(agendaEditorInitialState(selectedDate, entry));
      setValidation(null);
    }
  }, [entry, selectedDate, visible]);

  const setValue = <K extends keyof AgendaEditorValues>(
    key: K,
    value: AgendaEditorValues[K],
  ) => {
    setValues(current => ({...current, [key]: value}));
    if (validation) {
      setValidation(null);
    }
  };

  const submit = async () => {
    const result = buildAgendaDraft(selectedDate, values);
    if (!result.draft) {
      setValidation(result.error);
      return;
    }
    setValidation(null);
    await onSave(result.draft);
  };

  const modalDateLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(selectedDate);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={styles.flexOne}>
              <AppText variant="heading">
                {entry ? 'Edit Agenda' : 'Tambah Agenda'}
              </AppText>
              <AppText variant="caption" tone="muted">
                {modalDateLabel}
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tutup editor agenda"
              disabled={saving}
              onPress={onClose}
              style={({pressed}) => [
                styles.closeButton,
                pressed ? styles.closeButtonPressed : undefined,
              ]}>
              <AppText variant="heading" tone="muted">
                ×
              </AppText>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalContent}>
            <View style={styles.formSection}>
              <AppText variant="label" tone="secondary">
                Kategori
              </AppText>
              <View style={styles.choiceRow}>
                {CATEGORY_OPTIONS.map(category => (
                  <ChoicePill
                    key={category}
                    label={`${CATEGORY_META[category].glyph} ${CATEGORY_META[category].label}`}
                    active={values.category === category}
                    onPress={() => setValue('category', category)}
                  />
                ))}
              </View>
            </View>

            <TextField
              label="Judul agenda"
              value={values.title}
              onChangeText={text => setValue('title', text)}
              placeholder="Contoh: Rapat tim proyek"
              maxLength={120}
              autoCapitalize="sentences"
            />

            <View style={[styles.timeRow, compact ? styles.timeRowCompact : undefined]}>
              <TextField
                label="Mulai"
                value={values.startTime}
                onChangeText={text => setValue('startTime', text)}
                placeholder="09:00"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                containerStyle={compact ? undefined : styles.timeField}
              />
              <TextField
                label="Selesai"
                value={values.endTime}
                onChangeText={text => setValue('endTime', text)}
                placeholder="10:30"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                helperText="Opsional"
                containerStyle={compact ? undefined : styles.timeField}
              />
            </View>

            <TextField
              label="Lokasi"
              value={values.location}
              onChangeText={text => setValue('location', text)}
              placeholder="Contoh: Ruang keluarga"
              maxLength={240}
              helperText="Opsional"
            />

            <TextField
              label="Catatan"
              value={values.notes}
              onChangeText={text => setValue('notes', text)}
              placeholder="Tambahkan catatan agenda..."
              maxLength={1000}
              multiline
              textAlignVertical="top"
              helperText="Opsional"
              inputStyle={styles.notesInput}
            />

            <View style={styles.formSection}>
              <AppText variant="label" tone="secondary">
                Status
              </AppText>
              <View style={styles.choiceRow}>
                {STATUS_OPTIONS.map(status => (
                  <ChoicePill
                    key={status}
                    label={`${STATUS_META[status].glyph} ${STATUS_META[status].label}`}
                    active={values.status === status}
                    onPress={() => setValue('status', status)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.reminderSetting}>
              <View style={styles.reminderSettingCopy}>
                <AppText variant="bodyStrong">Reminder</AppText>
                <AppText variant="caption" tone="muted">
                  Notifikasi lokal sebelum agenda dimulai
                </AppText>
              </View>
              <Switch
                accessibilityLabel="Aktifkan reminder agenda"
                value={values.reminderEnabled && values.status !== 'completed'}
                disabled={values.status === 'completed'}
                onValueChange={value => setValue('reminderEnabled', value)}
                trackColor={{false: colors.border, true: colors.primaryMuted}}
                thumbColor={
                  values.reminderEnabled && values.status !== 'completed'
                    ? colors.primary
                    : colors.surface
                }
              />
            </View>

            {values.reminderEnabled && values.status !== 'completed' ? (
              <View style={styles.formSection}>
                <AppText variant="label" tone="secondary">
                  Ingatkan
                </AppText>
                <View style={styles.choiceRow}>
                  {REMINDER_OPTIONS.map(minutes => (
                    <ChoicePill
                      key={minutes}
                      label={reminderLabel(minutes)}
                      active={values.reminderMinutes === minutes}
                      onPress={() => setValue('reminderMinutes', minutes)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.pureAgendaHint}>
              <IconBadge glyph="i" tone="info" size="sm" />
              <AppText variant="caption" tone="muted" style={styles.flexOne}>
                Agenda adalah reminder murni. Tidak ada upload bukti, approval,
                atau verifikasi penyelesaian di modul ini.
              </AppText>
            </View>

            {validation ? (
              <View style={styles.validationBox}>
                <IconBadge glyph="!" tone="danger" size="sm" />
                <AppText variant="caption" tone="danger" style={styles.flexOne}>
                  {validation}
                </AppText>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <AppButton
                label="Batal"
                variant="outline"
                disabled={saving}
                onPress={onClose}
                style={styles.modalActionButton}
              />
              <AppButton
                label={entry ? 'Simpan Perubahan' : 'Simpan Agenda'}
                loading={saving}
                onPress={() => {
                  submit().catch(() => undefined);
                }}
                style={styles.modalActionButton}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ChoicePill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{selected: active}}
      onPress={onPress}
      style={({pressed}) => [
        styles.choicePill,
        active ? styles.choicePillActive : undefined,
        pressed ? styles.choicePillPressed : undefined,
      ]}>
      <AppText
        variant="label"
        tone={active ? 'primary' : 'secondary'}
        align="center">
        {label}
      </AppText>
    </Pressable>
  );
}

function reminderLabel(minutes: number): string {
  if (minutes === 0) {
    return 'Tepat waktu';
  }
  if (minutes === 60) {
    return '1 jam sebelum';
  }
  return `${minutes} mnt sebelum`;
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  content: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: 150,
    gap: spacing.lg,
  },
  flexOne: {flex: 1},
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identityRow: {
    maxWidth: '62%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  identityCopy: {flexShrink: 1},
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    backgroundColor: colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {flexDirection: 'row', gap: spacing.md},
  summaryCard: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  permissionCard: {
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.warningSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  permissionCopy: {flex: 1, gap: spacing.xxs},
  calendarCard: {borderRadius: radius.xl},
  calendarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  monthLabel: {textTransform: 'capitalize'},
  monthNavigation: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  monthNavigationLine: {flex: 1, height: 1, backgroundColor: colors.border},
  monthArrow: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrowText: {lineHeight: 26, marginTop: -2},
  monthArrowPressed: {opacity: 0.72, transform: [{scale: 0.96}]},
  weekHeader: {marginTop: spacing.md, flexDirection: 'row'},
  weekday: {width: '14.2857%', paddingVertical: spacing.sm},
  calendarGrid: {flexDirection: 'row', flexWrap: 'wrap'},
  dayCell: {
    width: '14.2857%',
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {backgroundColor: colors.primary},
  dayCellToday: {borderWidth: 1.2, borderColor: colors.primary},
  dayCellPressed: {opacity: 0.72},
  dayEventRow: {
    minHeight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xxs,
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  eventDotSelected: {backgroundColor: colors.primaryOn},
  sectionBlock: {gap: spacing.md},
  errorCard: {
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.dangerSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyCard: {alignItems: 'center', gap: spacing.md},
  emptyButton: {marginTop: spacing.sm},
  agendaList: {gap: spacing.md},
  agendaCard: {flexDirection: 'row', overflow: 'hidden'},
  agendaAccent: {width: 5, backgroundColor: colors.primary},
  agendaBody: {flex: 1, padding: spacing.lg},
  agendaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  badgeWrap: {flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  cardActions: {flexDirection: 'row', alignItems: 'center'},
  cardAction: {paddingHorizontal: spacing.sm, paddingVertical: spacing.xs},
  agendaTitle: {marginTop: spacing.md},
  agendaMetaList: {marginTop: spacing.md, gap: spacing.xs},
  metaLine: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  metaGlyph: {width: 18, textAlign: 'center'},
  notesBox: {
    marginTop: spacing.md,
    borderRadius: radius.sm,
    padding: spacing.md,
    backgroundColor: colors.infoSoft,
  },
  reminderLine: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reminderInfoCard: {
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.infoSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  fab: {position: 'absolute', right: 20, bottom: 94},
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  modalSheet: {
    maxHeight: '94%',
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    backgroundColor: colors.surface,
    paddingTop: spacing.sm,
    ...shadows.lg,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 46,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {opacity: 0.72},
  modalContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: 38,
    gap: spacing.lg,
  },
  formSection: {gap: spacing.sm},
  choiceRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  choicePill: {
    minHeight: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choicePillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  choicePillPressed: {opacity: 0.75},
  timeRow: {flexDirection: 'row', gap: spacing.md},
  timeRowCompact: {flexDirection: 'column'},
  timeField: {flex: 1},
  notesInput: {minHeight: 96, paddingVertical: spacing.md},
  reminderSetting: {
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  reminderSettingCopy: {flex: 1},
  pureAgendaHint: {
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.infoSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  validationBox: {
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.dangerSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  modalActions: {flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm},
  modalActionButton: {flex: 1},
});
