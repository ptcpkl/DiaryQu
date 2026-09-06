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
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {BrandMark} from '../../../components/common/BrandMark';
import {colors, radius, spacing} from '../../../constants/theme';
import {useAuthStore} from '../../auth/store/authStore';
import {useFamilyStore} from '../../family/store/familyStore';
import {agendaReminderService} from '../services/agendaReminderService';
import {useAgendaStore} from '../store/agendaStore';
import type {AgendaDraft, AgendaEntry, AgendaStatus} from '../types';
import {
  calendarCells,
  combineLocalDateAndTime,
  dateKey,
  formatShortDate,
  formatTime,
  monthRange,
} from '../utils/date';

const WEEKDAYS = ['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'];
const REMINDER_OPTIONS = [0, 5, 10, 30, 60];

const STATUS_META: Record<AgendaStatus, {label: string; glyph: string}> = {
  scheduled: {label: 'Terjadwal', glyph: '●'},
  postponed: {label: 'Ditunda', glyph: 'Ⅱ'},
  completed: {label: 'Selesai', glyph: '✓'},
};

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

  const range = useMemo(() => monthRange(visibleMonth), [visibleMonth]);
  const cells = useMemo(() => calendarCells(visibleMonth), [visibleMonth]);
  const selectedKey = dateKey(selectedDate);
  const eventDateKeys = useMemo(
    () => new Set(items.map(item => dateKey(new Date(item.startsAt)))),
    [items],
  );
  const selectedItems = useMemo(
    () =>
      items.filter(item => dateKey(new Date(item.startsAt)) === selectedKey),
    [items, selectedKey],
  );

  const familyId = family?.id ?? null;
  const userId = session?.user.id ?? null;

  useFocusEffect(
    useCallback(() => {
      if (familyId) {
        loadRange(familyId, range.startIso, range.endIso).catch(() => undefined);
      }
      refreshExactAlarmStatus().catch(() => undefined);
    }, [familyId, loadRange, range.endIso, range.startIso, refreshExactAlarmStatus]),
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

  const openCreate = () => {
    setEditorEntry(null);
    setEditorOpen(true);
    clearError();
  };

  const openEdit = (entry: AgendaEntry) => {
    setEditorEntry(entry);
    const date = new Date(entry.startsAt);
    setSelectedDate(date);
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <BrandMark compact />
          <View style={styles.headerIdentity}>
            <Text style={styles.headerName} numberOfLines={1}>
              {session?.user.user_metadata?.full_name ||
                session?.user.email?.split('@')[0] ||
                'DiaryQu'}
            </Text>
            <Text style={styles.headerRole}>
              {family?.role === 'head' ? 'Kepala Keluarga' : 'Anggota Keluarga'}
            </Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View>
            <Text style={styles.heroTitle}>Agenda</Text>
            <Text style={styles.heroSubtitle}>Atur jadwal Anda di sini</Text>
          </View>
          <View style={styles.heroIllustration}>
            <Text style={styles.heroGlyph}>▦</Text>
          </View>
        </View>

        {reminderIsExact === false ? (
          <View style={styles.permissionCard}>
            <View style={styles.permissionTextWrap}>
              <Text style={styles.permissionTitle}>Alarm presisi belum aktif</Text>
              <Text style={styles.permissionText}>
                Reminder tetap dijadwalkan Android, tetapi waktunya dapat sedikit bergeser.
              </Text>
            </View>
            <Pressable
              onPress={() => {
                agendaReminderService
                  .openExactAlarmSettings()
                  .catch(() => undefined);
              }}
              style={styles.permissionButton}>
              <Text style={styles.permissionButtonText}>Aktifkan</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.calendarCard}>
          <View style={styles.monthHeader}>
            <Pressable onPress={() => changeMonth(-1)} style={styles.monthArrow}>
              <Text style={styles.monthArrowText}>‹</Text>
            </Pressable>
            <Text style={styles.monthTitle}>{monthLabel}</Text>
            <Pressable onPress={() => changeMonth(1)} style={styles.monthArrow}>
              <Text style={styles.monthArrowText}>›</Text>
            </Pressable>
          </View>

          <View style={styles.weekHeader}>
            {WEEKDAYS.map(day => (
              <Text key={day} style={styles.weekday}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {cells.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const key = dateKey(date);
              const selected = key === selectedKey;
              const today = key === dateKey(new Date());
              const hasEvent = eventDateKeys.has(key);

              return (
                <Pressable
                  key={key}
                  onPress={() => setSelectedDate(date)}
                  style={[
                    styles.dayCell,
                    selected && styles.dayCellSelected,
                    today && !selected && styles.dayCellToday,
                  ]}>
                  <Text
                    style={[
                      styles.dayText,
                      selected && styles.dayTextSelected,
                    ]}>
                    {date.getDate()}
                  </Text>
                  {hasEvent ? (
                    <View
                      style={[
                        styles.eventDot,
                        selected && styles.eventDotSelected,
                      ]}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Jadwal</Text>
            <Text style={styles.sectionSubtitle}>
              {new Intl.DateTimeFormat('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }).format(selectedDate)}
            </Text>
          </View>
          <Pressable onPress={openCreate} style={styles.addSmallButton}>
            <Text style={styles.addSmallButtonText}>+ Tambah</Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={clearError}>
              <Text style={styles.errorAction}>Tutup</Text>
            </Pressable>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Memuat agenda...</Text>
          </View>
        ) : selectedItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyGlyph}>▦</Text>
            </View>
            <Text style={styles.emptyTitle}>Belum ada agenda</Text>
            <Text style={styles.emptyText}>
              Tambahkan jadwal dan DiaryQu akan mengingatkan Anda pada waktunya.
            </Text>
            <Pressable onPress={openCreate} style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>Buat Agenda</Text>
            </Pressable>
          </View>
        ) : (
          selectedItems.map(entry => (
            <AgendaCard
              key={entry.id}
              entry={entry}
              canManage={canManage(entry)}
              onEdit={() => openEdit(entry)}
              onDelete={() => confirmDelete(entry)}
            />
          ))
        )}
      </ScrollView>

      <Pressable onPress={openCreate} style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

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
  const meta = STATUS_META[entry.status];
  const statusStyle =
    entry.status === 'completed'
      ? styles.statusCompleted
      : entry.status === 'postponed'
        ? styles.statusPostponed
        : styles.statusScheduled;

  return (
    <View style={styles.agendaCard}>
      <View style={[styles.agendaAccent, statusStyle]} />
      <View style={styles.agendaBody}>
        <View style={styles.agendaTopRow}>
          <View style={[styles.statusPill, statusStyle]}>
            <Text style={styles.statusText}>
              {meta.glyph} {meta.label}
            </Text>
          </View>
          {canManage ? (
            <View style={styles.cardActions}>
              <Pressable onPress={onEdit} style={styles.cardActionButton}>
                <Text style={styles.cardActionText}>Edit</Text>
              </Pressable>
              <Pressable onPress={onDelete} style={styles.cardActionButton}>
                <Text style={styles.cardDeleteText}>Hapus</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <Text style={styles.agendaTitle}>{entry.title}</Text>
        <Text style={styles.agendaTime}>
          ◷ {formatTime(entry.startsAt)}
          {entry.endsAt ? ` – ${formatTime(entry.endsAt)}` : ''}
        </Text>
        {entry.location ? (
          <Text style={styles.agendaDetail}>⌖ {entry.location}</Text>
        ) : null}
        {entry.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>{entry.notes}</Text>
          </View>
        ) : null}
        {entry.reminderEnabled && entry.reminderAt ? (
          <Text style={styles.reminderText}>
            ◉ Reminder {formatShortDate(entry.reminderAt)} · {formatTime(entry.reminderAt)}
          </Text>
        ) : (
          <Text style={styles.reminderOffText}>Reminder tidak aktif</Text>
        )}
      </View>
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
  const initial = useMemo(() => editorInitialState(selectedDate, entry), [entry, selectedDate]);
  const [title, setTitle] = useState(initial.title);
  const [location, setLocation] = useState(initial.location);
  const [notes, setNotes] = useState(initial.notes);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [endTime, setEndTime] = useState(initial.endTime);
  const [reminderEnabled, setReminderEnabled] = useState(initial.reminderEnabled);
  const [reminderMinutes, setReminderMinutes] = useState(initial.reminderMinutes);
  const [status, setStatus] = useState<AgendaStatus>(initial.status);
  const [validation, setValidation] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      const next = editorInitialState(selectedDate, entry);
      setTitle(next.title);
      setLocation(next.location);
      setNotes(next.notes);
      setStartTime(next.startTime);
      setEndTime(next.endTime);
      setReminderEnabled(next.reminderEnabled);
      setReminderMinutes(next.reminderMinutes);
      setStatus(next.status);
      setValidation(null);
    }
  }, [entry, selectedDate, visible]);

  const submit = async () => {
    const start = combineLocalDateAndTime(selectedDate, startTime);
    const end = endTime.trim()
      ? combineLocalDateAndTime(selectedDate, endTime)
      : null;

    if (title.trim().length < 2) {
      setValidation('Judul agenda minimal 2 karakter.');
      return;
    }
    if (!start) {
      setValidation('Jam mulai harus menggunakan format HH:mm, contoh 09:30.');
      return;
    }
    if (endTime.trim() && !end) {
      setValidation('Jam selesai belum valid. Gunakan format HH:mm.');
      return;
    }
    if (end && end.getTime() <= start.getTime()) {
      setValidation('Jam selesai harus setelah jam mulai.');
      return;
    }

    const reminderAt = reminderEnabled
      ? new Date(start.getTime() - reminderMinutes * 60_000)
      : null;

    if (
      reminderEnabled &&
      status !== 'completed' &&
      reminderAt &&
      reminderAt.getTime() <= Date.now()
    ) {
      setValidation('Waktu reminder harus berada di masa depan.');
      return;
    }

    setValidation(null);
    await onSave({
      title,
      location,
      notes,
      startsAt: start.toISOString(),
      endsAt: end?.toISOString() ?? null,
      reminderEnabled: reminderEnabled && status !== 'completed',
      reminderAt:
        reminderEnabled && status !== 'completed'
          ? reminderAt?.toISOString() ?? start.toISOString()
          : null,
      status,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                {entry ? 'Edit Agenda' : 'Tambah Agenda'}
              </Text>
              <Text style={styles.modalDate}>
                {new Intl.DateTimeFormat('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }).format(selectedDate)}
              </Text>
            </View>
            <Pressable disabled={saving} onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalContent}>
            <FieldLabel text="Judul Agenda" />
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Contoh: Rapat Tim Proyek"
              placeholderTextColor="#A6AEAA"
              maxLength={120}
              style={styles.input}
            />

            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <FieldLabel text="Mulai" />
                <TextInput
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="09:00"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  style={styles.input}
                />
              </View>
              <View style={styles.timeField}>
                <FieldLabel text="Selesai (opsional)" />
                <TextInput
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="10:30"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  style={styles.input}
                />
              </View>
            </View>

            <FieldLabel text="Lokasi (opsional)" />
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Contoh: Jakarta Barat"
              placeholderTextColor="#A6AEAA"
              maxLength={240}
              style={styles.input}
            />

            <FieldLabel text="Catatan (opsional)" />
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Tambahkan catatan agenda..."
              placeholderTextColor="#A6AEAA"
              maxLength={1000}
              multiline
              textAlignVertical="top"
              style={[styles.input, styles.notesInput]}
            />

            <FieldLabel text="Status" />
            <View style={styles.statusSelector}>
              {(Object.keys(STATUS_META) as AgendaStatus[]).map(value => (
                <Pressable
                  key={value}
                  onPress={() => setStatus(value)}
                  style={[
                    styles.statusOption,
                    status === value && styles.statusOptionActive,
                  ]}>
                  <Text
                    style={[
                      styles.statusOptionText,
                      status === value && styles.statusOptionTextActive,
                    ]}>
                    {STATUS_META[value].label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.reminderHeader}>
              <View style={styles.reminderLabelWrap}>
                <Text style={styles.fieldLabel}>Reminder</Text>
                <Text style={styles.reminderHint}>
                  Notifikasi lokal di perangkat Android
                </Text>
              </View>
              <Switch
                value={reminderEnabled && status !== 'completed'}
                disabled={status === 'completed'}
                onValueChange={setReminderEnabled}
                trackColor={{false: '#D6DEDA', true: colors.primaryMuted}}
                thumbColor={
                  reminderEnabled && status !== 'completed'
                    ? colors.primary
                    : '#FFFFFF'
                }
              />
            </View>

            {reminderEnabled && status !== 'completed' ? (
              <View style={styles.reminderOptions}>
                {REMINDER_OPTIONS.map(minutes => (
                  <Pressable
                    key={minutes}
                    onPress={() => setReminderMinutes(minutes)}
                    style={[
                      styles.reminderChip,
                      reminderMinutes === minutes && styles.reminderChipActive,
                    ]}>
                    <Text
                      style={[
                        styles.reminderChipText,
                        reminderMinutes === minutes && styles.reminderChipTextActive,
                      ]}>
                      {minutes === 0
                        ? 'Tepat waktu'
                        : minutes === 60
                          ? '1 jam sebelum'
                          : `${minutes} mnt sebelum`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {validation ? (
              <View style={styles.validationBox}>
                <Text style={styles.validationText}>{validation}</Text>
              </View>
            ) : null}

            <Pressable
              disabled={saving}
              onPress={() => {
                submit().catch(() => undefined);
              }}
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {entry ? 'Simpan Perubahan' : 'Simpan Agenda'}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FieldLabel({text}: {text: string}) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

function editorInitialState(selectedDate: Date, entry: AgendaEntry | null) {
  if (entry) {
    const start = new Date(entry.startsAt);
    const reminderMinutes = entry.reminderAt
      ? Math.max(
          0,
          Math.round((start.getTime() - new Date(entry.reminderAt).getTime()) / 60_000),
        )
      : 10;

    return {
      title: entry.title,
      location: entry.location ?? '',
      notes: entry.notes ?? '',
      startTime: formatTime(entry.startsAt).replace('.', ':'),
      endTime: entry.endsAt ? formatTime(entry.endsAt).replace('.', ':') : '',
      reminderEnabled: entry.reminderEnabled,
      reminderMinutes: REMINDER_OPTIONS.includes(reminderMinutes)
        ? reminderMinutes
        : 10,
      status: entry.status,
    };
  }

  const now = new Date();
  const sameDay = dateKey(now) === dateKey(selectedDate);
  const startHour = sameDay ? Math.min(23, now.getHours() + 1) : 9;
  const endHour = Math.min(23, startHour + 1);

  return {
    title: '',
    location: '',
    notes: '',
    startTime: `${String(startHour).padStart(2, '0')}:00`,
    endTime: `${String(endHour).padStart(2, '0')}:00`,
    reminderEnabled: true,
    reminderMinutes: 10,
    status: 'scheduled' as AgendaStatus,
  };
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  content: {padding: spacing.xl, paddingBottom: 130, gap: spacing.lg},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIdentity: {alignItems: 'flex-end', maxWidth: '55%'},
  headerName: {fontSize: 15, fontWeight: '800', color: colors.text},
  headerRole: {fontSize: 11, color: colors.textMuted, marginTop: 2},
  hero: {
    minHeight: 112,
    borderRadius: radius.lg,
    backgroundColor: '#25AF80',
    padding: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  heroTitle: {fontSize: 22, fontWeight: '900', color: '#FFFFFF'},
  heroSubtitle: {fontSize: 14, color: '#E6FFF6', marginTop: 5},
  heroIllustration: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGlyph: {fontSize: 42, color: '#FFFFFF'},
  permissionCard: {
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permissionTextWrap: {flex: 1},
  permissionTitle: {fontSize: 13, fontWeight: '800', color: '#6A5700'},
  permissionText: {fontSize: 11, lineHeight: 16, color: '#756822', marginTop: 3},
  permissionButton: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F1CF58',
  },
  permissionButtonText: {fontSize: 11, fontWeight: '800', color: '#5C4B00'},
  calendarCard: {
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    shadowColor: colors.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 7},
    elevation: 3,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  monthArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrowText: {fontSize: 28, lineHeight: 30, color: colors.primaryDark},
  monthTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    textTransform: 'capitalize',
  },
  weekHeader: {flexDirection: 'row'},
  weekday: {
    width: '14.2857%',
    textAlign: 'center',
    fontSize: 9,
    color: '#9AA4A0',
    fontWeight: '700',
    paddingVertical: 7,
  },
  calendarGrid: {flexDirection: 'row', flexWrap: 'wrap'},
  dayCell: {
    width: '14.2857%',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {backgroundColor: colors.primary},
  dayCellToday: {borderWidth: 1, borderColor: colors.primaryMuted},
  dayText: {fontSize: 14, color: colors.text},
  dayTextSelected: {color: '#FFFFFF', fontWeight: '900'},
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 3,
  },
  eventDotSelected: {backgroundColor: '#FFFFFF'},
  sectionHeader: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {fontSize: 19, fontWeight: '900', color: colors.text},
  sectionSubtitle: {fontSize: 12, color: colors.textMuted, marginTop: 3},
  addSmallButton: {
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  addSmallButtonText: {fontSize: 12, fontWeight: '800', color: colors.primaryDark},
  errorCard: {
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {flex: 1, color: colors.danger, fontSize: 12, lineHeight: 18},
  errorAction: {fontSize: 12, fontWeight: '900', color: colors.danger},
  loadingCard: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {fontSize: 12, color: colors.textMuted},
  emptyCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.xxl,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 2,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGlyph: {fontSize: 27, color: colors.primaryDark},
  emptyTitle: {fontSize: 16, fontWeight: '900', color: colors.text, marginTop: 14},
  emptyText: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: 5,
  },
  emptyButton: {
    marginTop: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  emptyButtonText: {color: '#FFFFFF', fontSize: 12, fontWeight: '900'},
  agendaCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 2,
  },
  agendaAccent: {width: 5},
  agendaBody: {flex: 1, padding: spacing.xl},
  agendaTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  statusPill: {borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 5},
  statusScheduled: {backgroundColor: '#DDF6ED'},
  statusPostponed: {backgroundColor: '#FFE5E5'},
  statusCompleted: {backgroundColor: '#DDF6E8'},
  statusText: {fontSize: 10, fontWeight: '800', color: '#315047'},
  cardActions: {flexDirection: 'row', gap: 4},
  cardActionButton: {paddingHorizontal: 8, paddingVertical: 5},
  cardActionText: {fontSize: 11, fontWeight: '800', color: colors.primaryDark},
  cardDeleteText: {fontSize: 11, fontWeight: '800', color: colors.danger},
  agendaTitle: {fontSize: 16, fontWeight: '900', color: colors.text, marginTop: 13},
  agendaTime: {fontSize: 12, color: colors.textMuted, marginTop: 9},
  agendaDetail: {fontSize: 12, color: colors.textMuted, marginTop: 6},
  notesBox: {
    marginTop: 12,
    borderRadius: radius.sm,
    backgroundColor: '#F0F4FF',
    padding: spacing.md,
  },
  notesText: {fontSize: 12, lineHeight: 18, color: colors.textMuted},
  reminderText: {fontSize: 10, color: colors.primaryDark, marginTop: 10, fontWeight: '700'},
  reminderOffText: {fontSize: 10, color: '#8D9692', marginTop: 10},
  fab: {
    position: 'absolute',
    right: 22,
    bottom: 92,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 7},
    elevation: 8,
  },
  fabText: {color: '#FFFFFF', fontSize: 34, lineHeight: 36, fontWeight: '300'},
  modalBackdrop: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(17,31,27,0.35)'},
  modalSheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.surface,
    paddingTop: 10,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5D0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  modalTitle: {fontSize: 21, fontWeight: '900', color: colors.text},
  modalDate: {fontSize: 11, color: colors.textMuted, marginTop: 4},
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F4F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {fontSize: 25, color: colors.textMuted, lineHeight: 27},
  modalContent: {paddingHorizontal: spacing.xl, paddingBottom: 38},
  fieldLabel: {fontSize: 12, fontWeight: '800', color: colors.text, marginTop: 16, marginBottom: 7},
  input: {
    minHeight: 52,
    borderWidth: 1.4,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    backgroundColor: '#FCFDFC',
    fontSize: 13,
  },
  notesInput: {height: 92, paddingTop: 14},
  timeRow: {flexDirection: 'row', gap: 10},
  timeField: {flex: 1},
  statusSelector: {flexDirection: 'row', gap: 7},
  statusOption: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F5F4',
  },
  statusOptionActive: {backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary},
  statusOptionText: {fontSize: 10, fontWeight: '700', color: colors.textMuted},
  statusOptionTextActive: {color: colors.primaryDark, fontWeight: '900'},
  reminderHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4},
  reminderLabelWrap: {flex: 1},
  reminderHint: {fontSize: 10, color: colors.textMuted, marginTop: -4},
  reminderOptions: {flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10},
  reminderChip: {borderRadius: radius.pill, backgroundColor: '#F2F5F4', paddingHorizontal: 11, paddingVertical: 8},
  reminderChipActive: {backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary},
  reminderChipText: {fontSize: 10, fontWeight: '700', color: colors.textMuted},
  reminderChipTextActive: {color: colors.primaryDark, fontWeight: '900'},
  validationBox: {marginTop: 16, borderRadius: radius.md, backgroundColor: colors.dangerSoft, padding: spacing.md},
  validationText: {fontSize: 11, lineHeight: 17, color: colors.danger, fontWeight: '700'},
  saveButton: {marginTop: 22, minHeight: 54, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center'},
  saveButtonDisabled: {opacity: 0.65},
  saveButtonText: {color: '#FFFFFF', fontSize: 14, fontWeight: '900'},
});
