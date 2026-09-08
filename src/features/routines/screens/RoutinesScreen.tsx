import {useFocusEffect} from '@react-navigation/native';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import {colors, radius, shadows, spacing} from '../../../constants/theme';
import {useAuthStore} from '../../auth/store/authStore';
import {useFamilyStore} from '../../family/store/familyStore';
import {routineProofPickerService} from '../services/routineProofPickerService';
import {useRoutineStore} from '../store/routineStore';
import type {
  PickedRoutineProof,
  RoutineDefinition,
  RoutineDraft,
  RoutineMember,
  RoutineSubmission,
} from '../types';
import {
  WEEKDAY_OPTIONS,
  addDays,
  localDateKey,
  routineOccursOn,
  routineScheduleLabel,
  routineStats,
  submissionFor,
  validateRoutineDraft,
} from '../utils/schedule';

export function RoutinesScreen() {
  const family = useFamilyStore(state => state.family);
  const session = useAuthStore(state => state.session);
  const members = useRoutineStore(state => state.members);
  const routines = useRoutineStore(state => state.routines);
  const submissions = useRoutineStore(state => state.submissions);
  const isLoading = useRoutineStore(state => state.isLoading);
  const isSaving = useRoutineStore(state => state.isSaving);
  const error = useRoutineStore(state => state.error);
  const load = useRoutineStore(state => state.load);
  const saveRoutine = useRoutineStore(state => state.saveRoutine);
  const removeRoutine = useRoutineStore(state => state.removeRoutine);
  const submitCompletion = useRoutineStore(state => state.submitCompletion);
  const reviewSubmission = useRoutineStore(state => state.reviewSubmission);
  const subscribeFamily = useRoutineStore(state => state.subscribeFamily);
  const clearError = useRoutineStore(state => state.clearError);

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [headTab, setHeadTab] = useState<'routines' | 'approval'>('routines');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorRoutine, setEditorRoutine] = useState<RoutineDefinition | null>(null);
  const [proofRoutine, setProofRoutine] = useState<RoutineDefinition | null>(null);
  const [proofOpen, setProofOpen] = useState(false);
  const [rejectSubmission, setRejectSubmission] = useState<RoutineSubmission | null>(null);

  const familyId = family?.id ?? null;
  const userId = session?.user.id ?? null;
  const dateKey = localDateKey(selectedDate);
  const todayKey = localDateKey(new Date());
  const isHead = family?.role === 'head';

  useFocusEffect(
    useCallback(() => {
      if (familyId) {
        load(familyId, dateKey).catch(() => undefined);
      }
    }, [dateKey, familyId, load]),
  );

  useEffect(() => {
    if (!familyId) return undefined;
    return subscribeFamily(familyId);
  }, [familyId, subscribeFamily]);

  const memberMap = useMemo(
    () => new Map(members.map(member => [member.id, member])),
    [members],
  );

  const dueRoutines = useMemo(
    () =>
      routines.filter(
        routine =>
          routineOccursOn(routine, selectedDate) &&
          (isHead || (userId ? routine.assigneeIds.includes(userId) : false)),
      ),
    [isHead, routines, selectedDate, userId],
  );

  const pendingApprovals = useMemo(
    () =>
      submissions
        .filter(item => item.status === 'pending')
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [submissions],
  );

  const stats = useMemo(
    () => routineStats(routines, submissions, selectedDate, userId ?? '', isHead),
    [isHead, routines, selectedDate, submissions, userId],
  );

  const changeDate = (delta: number) => {
    setSelectedDate(current => addDays(current, delta));
    clearError();
  };

  const openCreate = () => {
    setEditorRoutine(null);
    setEditorOpen(true);
    clearError();
  };

  const openEdit = (routine: RoutineDefinition) => {
    setEditorRoutine(routine);
    setEditorOpen(true);
    clearError();
  };

  const confirmDelete = (routine: RoutineDefinition) => {
    if (!familyId) return;
    Alert.alert(
      'Hapus rutinitas?',
      `Rutinitas “${routine.title}” beserta riwayat bukti akan dihapus.`,
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

  const saveEditor = async (draft: RoutineDraft) => {
    if (!familyId) return false;
    const success = await saveRoutine(familyId, editorRoutine?.id ?? null, draft);
    if (success) {
      setEditorOpen(false);
      setEditorRoutine(null);
    }
    return success;
  };

  const openProof = (routine: RoutineDefinition) => {
    setProofRoutine(routine);
    setProofOpen(true);
    clearError();
  };

  const approve = (submission: RoutineSubmission) => {
    if (!familyId || !userId) return;
    const member = memberMap.get(submission.memberId);
    Alert.alert(
      'Setujui bukti?',
      `Bukti ${member?.fullName ?? 'anggota'} akan ditandai selesai.`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Setujui',
          onPress: () => {
            reviewSubmission({
              familyId,
              reviewerId: userId,
              submissionId: submission.id,
              decision: 'approved',
              note: null,
            }).catch(() => undefined);
          },
        },
      ],
    );
  };

  const headerName =
    session?.user.user_metadata?.full_name || session?.user.email?.split('@')[0] || 'DiaryQu';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <BrandMark compact />
          <View style={styles.identity}>
            <Text style={styles.identityName} numberOfLines={1}>{headerName}</Text>
            <Text style={styles.identityRole}>
              {isHead ? 'Kepala Keluarga' : 'Anggota Keluarga'}
            </Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>Rutinitas Harian</Text>
            <Text style={styles.heroSubtitle}>
              Bangun kebiasaan baik bersama keluarga, satu tugas setiap hari.
            </Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroGlyph}>✓</Text>
          </View>
        </View>

        <View style={styles.dateCard}>
          <Pressable onPress={() => changeDate(-1)} style={styles.dateArrow}>
            <Text style={styles.dateArrowText}>‹</Text>
          </Pressable>
          <View style={styles.dateCenter}>
            <Text style={styles.dateLabel}>
              {new Intl.DateTimeFormat('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).format(selectedDate)}
            </Text>
            {dateKey !== todayKey ? (
              <Pressable onPress={() => setSelectedDate(new Date())}>
                <Text style={styles.todayAction}>Kembali ke hari ini</Text>
              </Pressable>
            ) : (
              <Text style={styles.todayBadge}>Hari ini</Text>
            )}
          </View>
          <Pressable onPress={() => changeDate(1)} style={styles.dateArrow}>
            <Text style={styles.dateArrowText}>›</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <StatCard value={`${stats.progress}%`} label="Tuntas" tone="green" />
          <StatCard value={String(stats.approved)} label="Disetujui" tone="blue" />
          <StatCard value={String(stats.pending)} label="Menunggu" tone="yellow" />
          <StatCard value={String(stats.target)} label="Target" tone="gray" />
        </View>

        {isHead ? (
          <View style={styles.tabs}>
            <Pressable
              onPress={() => setHeadTab('routines')}
              style={[styles.tab, headTab === 'routines' && styles.tabActive]}>
              <Text style={[styles.tabText, headTab === 'routines' && styles.tabTextActive]}>
                Rutinitas
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setHeadTab('approval')}
              style={[styles.tab, headTab === 'approval' && styles.tabActive]}>
              <Text style={[styles.tabText, headTab === 'approval' && styles.tabTextActive]}>
                Persetujuan {pendingApprovals.length > 0 ? `(${pendingApprovals.length})` : ''}
              </Text>
            </Pressable>
          </View>
        ) : null}

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
            <Text style={styles.loadingText}>Memuat rutinitas keluarga...</Text>
          </View>
        ) : isHead && headTab === 'approval' ? (
          <ApprovalList
            submissions={pendingApprovals}
            routines={routines}
            memberMap={memberMap}
            currentUserId={userId}
            saving={isSaving}
            onApprove={approve}
            onReject={setRejectSubmission}
          />
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  {isHead ? 'Rutinitas keluarga' : 'Tugas saya'}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {dueRoutines.length} rutinitas aktif pada tanggal ini
                </Text>
              </View>
              {isHead ? (
                <Pressable onPress={openCreate} style={styles.addButton}>
                  <Text style={styles.addButtonText}>+ Tambah</Text>
                </Pressable>
              ) : null}
            </View>

            {dueRoutines.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}><Text style={styles.emptyGlyph}>✓</Text></View>
                <Text style={styles.emptyTitle}>Belum ada rutinitas</Text>
                <Text style={styles.emptyText}>
                  {isHead
                    ? 'Buat rutinitas dan tugaskan kepada anggota keluarga.'
                    : 'Belum ada tugas yang dijadwalkan untuk Anda pada tanggal ini.'}
                </Text>
                {isHead ? (
                  <Pressable onPress={openCreate} style={styles.emptyButton}>
                    <Text style={styles.emptyButtonText}>Buat Rutinitas</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              dueRoutines.map(routine => {
                const ownSubmission = userId
                  ? submissionFor(submissions, routine.id, userId, dateKey)
                  : null;
                return (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    members={memberMap}
                    isHead={isHead}
                    currentUserId={userId}
                    occurrenceDate={dateKey}
                    todayKey={todayKey}
                    submission={ownSubmission}
                    saving={isSaving}
                    onEdit={() => openEdit(routine)}
                    onDelete={() => confirmDelete(routine)}
                    onSubmit={() => openProof(routine)}
                  />
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {isHead && headTab === 'routines' ? (
        <Pressable onPress={openCreate} style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      ) : null}

      <RoutineEditorModal
        visible={editorOpen}
        routine={editorRoutine}
        members={members}
        saving={isSaving}
        onClose={() => {
          if (!isSaving) {
            setEditorOpen(false);
            setEditorRoutine(null);
          }
        }}
        onSave={saveEditor}
      />

      <ProofModal
        visible={proofOpen}
        routine={proofRoutine}
        familyId={familyId}
        userId={userId}
        occurrenceDate={dateKey}
        saving={isSaving}
        onClose={() => {
          if (!isSaving) {
            setProofOpen(false);
            setProofRoutine(null);
          }
        }}
        onSubmit={async (routine, proof, note) => {
          if (!familyId || !userId) return false;
          const success = await submitCompletion({
            familyId,
            userId,
            routine,
            occurrenceDate: dateKey,
            proof,
            note,
          });
          if (success) {
            setProofOpen(false);
            setProofRoutine(null);
          }
          return success;
        }}
      />

      <RejectModal
        visible={Boolean(rejectSubmission)}
        submission={rejectSubmission}
        saving={isSaving}
        onClose={() => !isSaving && setRejectSubmission(null)}
        onReject={async note => {
          if (!rejectSubmission || !familyId || !userId) return false;
          const success = await reviewSubmission({
            familyId,
            reviewerId: userId,
            submissionId: rejectSubmission.id,
            decision: 'rejected',
            note,
          });
          if (success) setRejectSubmission(null);
          return success;
        }}
      />
    </SafeAreaView>
  );
}

function StatCard({value, label, tone}: {value: string; label: string; tone: 'green' | 'blue' | 'yellow' | 'gray'}) {
  const toneStyle =
    tone === 'green'
      ? styles.statGreen
      : tone === 'blue'
        ? styles.statBlue
        : tone === 'yellow'
          ? styles.statYellow
          : styles.statGray;
  return (
    <View style={[styles.statCard, toneStyle]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function RoutineCard({
  routine,
  members,
  isHead,
  currentUserId,
  occurrenceDate,
  todayKey,
  submission,
  saving,
  onEdit,
  onDelete,
  onSubmit,
}: {
  routine: RoutineDefinition;
  members: Map<string, RoutineMember>;
  isHead: boolean;
  currentUserId: string | null;
  occurrenceDate: string;
  todayKey: string;
  submission: RoutineSubmission | null;
  saving: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSubmit: () => void;
}) {
  const assignedToMe = currentUserId ? routine.assigneeIds.includes(currentUserId) : false;
  const assigneeNames = routine.assigneeIds
    .map(id => members.get(id)?.fullName ?? 'Anggota')
    .join(', ');
  const statusLabel = submission
    ? submission.status === 'approved'
      ? 'Disetujui'
      : submission.status === 'pending'
        ? 'Menunggu persetujuan'
        : 'Perlu diperbaiki'
    : 'Belum dikerjakan';
  const statusStyle = submission
    ? submission.status === 'approved'
      ? styles.statusApproved
      : submission.status === 'pending'
        ? styles.statusPending
        : styles.statusRejected
    : styles.statusEmpty;
  const canSubmit = assignedToMe && occurrenceDate <= todayKey && submission?.status !== 'approved' && submission?.status !== 'pending';

  return (
    <View style={styles.routineCard}>
      <View style={styles.routineTop}>
        <View style={styles.routineIcon}><Text style={styles.routineIconText}>✓</Text></View>
        <View style={styles.routineTitleWrap}>
          <Text style={styles.routineTitle}>{routine.title}</Text>
          <Text style={styles.routineSchedule}>{routineScheduleLabel(routine)}</Text>
        </View>
        {isHead ? (
          <View style={styles.routineActions}>
            <Pressable onPress={onEdit} style={styles.smallAction}><Text style={styles.editText}>Edit</Text></Pressable>
            <Pressable onPress={onDelete} style={styles.smallAction}><Text style={styles.deleteText}>Hapus</Text></Pressable>
          </View>
        ) : null}
      </View>

      {routine.description ? <Text style={styles.routineDescription}>{routine.description}</Text> : null}

      <View style={styles.metaGrid}>
        <View style={styles.metaPill}><Text style={styles.metaText}>👥 {assigneeNames}</Text></View>
        <View style={styles.metaPill}><Text style={styles.metaText}>★ {routine.rewardPoints} poin</Text></View>
        <View style={styles.metaPill}><Text style={styles.metaText}>{routine.proofRequired ? '📷 Bukti foto' : '✓ Tanpa foto'}</Text></View>
      </View>

      {assignedToMe ? (
        <View style={styles.submissionArea}>
          <View style={[styles.statusPill, statusStyle]}><Text style={styles.statusText}>{statusLabel}</Text></View>
          {submission?.reviewNote ? <Text style={styles.reviewNote}>Catatan: {submission.reviewNote}</Text> : null}
          {submission?.proofNote ? <Text style={styles.proofNote}>“{submission.proofNote}”</Text> : null}
          {canSubmit ? (
            <Pressable disabled={saving} onPress={onSubmit} style={styles.submitProofButton}>
              <Text style={styles.submitProofButtonText}>
                {submission?.status === 'rejected'
                  ? 'Kirim Ulang Bukti'
                  : routine.proofRequired
                    ? 'Kirim Bukti'
                    : 'Tandai Selesai'}
              </Text>
            </Pressable>
          ) : null}
          {occurrenceDate > todayKey ? <Text style={styles.futureHint}>Bukti dapat dikirim saat tanggal rutinitas tiba.</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

function ApprovalList({
  submissions,
  routines,
  memberMap,
  currentUserId,
  saving,
  onApprove,
  onReject,
}: {
  submissions: RoutineSubmission[];
  routines: RoutineDefinition[];
  memberMap: Map<string, RoutineMember>;
  currentUserId: string | null;
  saving: boolean;
  onApprove: (submission: RoutineSubmission) => void;
  onReject: (submission: RoutineSubmission) => void;
}) {
  const routineMap = new Map(routines.map(routine => [routine.id, routine]));

  if (submissions.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <View style={styles.emptyIcon}><Text style={styles.emptyGlyph}>✓</Text></View>
        <Text style={styles.emptyTitle}>Tidak ada yang menunggu</Text>
        <Text style={styles.emptyText}>Semua bukti rutinitas keluarga sudah ditinjau.</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Perlu persetujuan</Text>
          <Text style={styles.sectionSubtitle}>{submissions.length} bukti menunggu tinjauan kepala keluarga</Text>
        </View>
      </View>
      {submissions.map(submission => {
        const routine = routineMap.get(submission.routineId);
        const member = memberMap.get(submission.memberId);
        const selfSubmission = submission.memberId === currentUserId;
        return (
          <View key={submission.id} style={styles.approvalCard}>
            <View style={styles.approvalHeader}>
              <View style={styles.avatarCircle}><Text style={styles.avatarText}>{(member?.fullName ?? 'A').charAt(0).toUpperCase()}</Text></View>
              <View style={styles.approvalIdentity}>
                <Text style={styles.approvalName}>{member?.fullName ?? 'Anggota Keluarga'}</Text>
                <Text style={styles.approvalRoutine}>{routine?.title ?? 'Rutinitas'} · {submission.occurrenceDate}</Text>
              </View>
            </View>
            {submission.proofUrl ? (
              <Image source={{uri: submission.proofUrl}} resizeMode="cover" style={styles.proofImage} />
            ) : submission.proofPath ? (
              <View style={styles.proofPlaceholder}><Text style={styles.proofPlaceholderText}>📷 Bukti foto tersimpan</Text></View>
            ) : null}
            {submission.proofNote ? <Text style={styles.approvalNote}>{submission.proofNote}</Text> : null}
            {selfSubmission ? (
              <View style={styles.selfApprovalWarning}>
                <Text style={styles.selfApprovalText}>Bukti Anda sendiri harus ditinjau oleh kepala keluarga lain.</Text>
              </View>
            ) : (
              <View style={styles.reviewActions}>
                <Pressable disabled={saving} onPress={() => onReject(submission)} style={styles.rejectButton}><Text style={styles.rejectButtonText}>Tolak</Text></Pressable>
                <Pressable disabled={saving} onPress={() => onApprove(submission)} style={styles.approveButton}><Text style={styles.approveButtonText}>Setujui</Text></Pressable>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function RoutineEditorModal({
  visible,
  routine,
  members,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean;
  routine: RoutineDefinition | null;
  members: RoutineMember[];
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
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
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
    setAssigneeIds(routine?.assigneeIds ?? []);
    setValidation(null);
  }, [routine, visible]);

  const toggleWeekday = (day: number) => {
    setWeekdays(current => current.includes(day) ? current.filter(item => item !== day) : [...current, day]);
  };

  const toggleAssignee = (id: string) => {
    setAssigneeIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  };

  const submit = async () => {
    const rewardPoints = Number(reward);
    const draft: RoutineDraft = {
      title,
      description,
      scheduleType,
      weekdays: scheduleType === 'daily' ? [] : weekdays,
      startDate,
      endDate: endDate.trim() || null,
      rewardPoints,
      proofRequired,
      isActive,
      assigneeIds,
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{routine ? 'Edit Rutinitas' : 'Tambah Rutinitas'}</Text>
              <Text style={styles.modalSubtitle}>Atur jadwal, anggota, bukti, dan poin hadiah.</Text>
            </View>
            <Pressable disabled={saving} onPress={onClose} style={styles.closeButton}><Text style={styles.closeText}>×</Text></Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
            <FieldLabel text="Nama Rutinitas" />
            <TextInput value={title} onChangeText={setTitle} maxLength={120} placeholder="Contoh: Rapikan kamar" placeholderTextColor={colors.textSubtle} style={styles.input} />

            <FieldLabel text="Deskripsi (opsional)" />
            <TextInput value={description} onChangeText={setDescription} maxLength={1000} multiline textAlignVertical="top" placeholder="Petunjuk singkat untuk anggota keluarga" placeholderTextColor={colors.textSubtle} style={[styles.input, styles.multilineInput]} />

            <FieldLabel text="Pengulangan" />
            <View style={styles.choiceRow}>
              <Choice active={scheduleType === 'daily'} label="Setiap hari" onPress={() => setScheduleType('daily')} />
              <Choice active={scheduleType === 'weekly'} label="Hari tertentu" onPress={() => setScheduleType('weekly')} />
            </View>

            {scheduleType === 'weekly' ? (
              <View style={styles.weekdayRow}>
                {WEEKDAY_OPTIONS.map(option => (
                  <Pressable key={option.value} onPress={() => toggleWeekday(option.value)} style={[styles.weekdayChip, weekdays.includes(option.value) && styles.weekdayChipActive]}>
                    <Text style={[styles.weekdayText, weekdays.includes(option.value) && styles.weekdayTextActive]}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <View style={styles.twoColumns}>
              <View style={styles.column}><FieldLabel text="Mulai" /><TextInput value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" style={styles.input} /></View>
              <View style={styles.column}><FieldLabel text="Selesai (opsional)" /><TextInput value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" style={styles.input} /></View>
            </View>

            <FieldLabel text="Poin Hadiah" />
            <TextInput value={reward} onChangeText={setReward} keyboardType="number-pad" maxLength={6} placeholder="0" style={styles.input} />

            <FieldLabel text="Tugaskan Kepada" />
            <View style={styles.memberList}>
              {members.map(member => {
                const active = assigneeIds.includes(member.id);
                return (
                  <Pressable key={member.id} onPress={() => toggleAssignee(member.id)} style={[styles.memberOption, active && styles.memberOptionActive]}>
                    <View style={styles.memberAvatar}><Text style={styles.memberAvatarText}>{member.fullName.charAt(0).toUpperCase()}</Text></View>
                    <View style={styles.memberTextWrap}>
                      <Text style={styles.memberName}>{member.fullName}</Text>
                      <Text style={styles.memberRole}>{member.role === 'head' ? 'Kepala keluarga' : 'Anggota'}</Text>
                    </View>
                    <View style={[styles.checkCircle, active && styles.checkCircleActive]}><Text style={styles.checkMark}>{active ? '✓' : ''}</Text></View>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchTextWrap}><Text style={styles.switchTitle}>Wajib bukti foto</Text><Text style={styles.switchHint}>Anggota harus memilih foto sebelum mengirim penyelesaian.</Text></View>
              <Switch value={proofRequired} onValueChange={setProofRequired} trackColor={{false: colors.border, true: colors.primaryMuted}} thumbColor={proofRequired ? colors.primary : '#FFFFFF'} />
            </View>
            <View style={styles.switchRow}>
              <View style={styles.switchTextWrap}><Text style={styles.switchTitle}>Rutinitas aktif</Text><Text style={styles.switchHint}>Rutinitas nonaktif tidak muncul sebagai tugas harian.</Text></View>
              <Switch value={isActive} onValueChange={setIsActive} trackColor={{false: colors.border, true: colors.primaryMuted}} thumbColor={isActive ? colors.primary : '#FFFFFF'} />
            </View>

            {validation ? <View style={styles.validationBox}><Text style={styles.validationText}>{validation}</Text></View> : null}

            <Pressable disabled={saving} onPress={() => submit().catch(() => undefined)} style={[styles.primaryButton, saving && styles.disabled]}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{routine ? 'Simpan Perubahan' : 'Simpan Rutinitas'}</Text>}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ProofModal({
  visible,
  routine,
  familyId,
  userId,
  occurrenceDate,
  saving,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  routine: RoutineDefinition | null;
  familyId: string | null;
  userId: string | null;
  occurrenceDate: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (routine: RoutineDefinition, proof: PickedRoutineProof | null, note: string | null) => Promise<boolean>;
}) {
  const [proof, setProof] = useState<PickedRoutineProof | null>(null);
  const [note, setNote] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setProof(null);
      setNote('');
      setLocalError(null);
    }
  }, [visible, routine?.id]);

  const pick = async () => {
    try {
      const picked = await routineProofPickerService.pickImage();
      setProof(picked);
      setLocalError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error ?? '');
      if (message.toUpperCase().includes('CANCEL')) return;
      setLocalError(
        message.toUpperCase().includes('TOO_LARGE')
          ? 'Ukuran foto maksimal 6 MB.'
          : 'Foto belum dapat dipilih. Gunakan JPG, PNG, atau WEBP.',
      );
    }
  };

  const submit = async () => {
    if (!routine || !familyId || !userId) return;
    if (routine.proofRequired && !proof) {
      setLocalError('Rutinitas ini membutuhkan bukti foto.');
      return;
    }
    setLocalError(null);
    await onSubmit(routine, proof, note.trim() || null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
        <View style={styles.compactSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View><Text style={styles.modalTitle}>Kirim Bukti</Text><Text style={styles.modalSubtitle}>{routine?.title} · {occurrenceDate}</Text></View>
            <Pressable disabled={saving} onPress={onClose} style={styles.closeButton}><Text style={styles.closeText}>×</Text></Pressable>
          </View>
          <View style={styles.proofContent}>
            <Pressable disabled={saving} onPress={() => pick().catch(() => undefined)} style={[styles.photoPicker, proof && styles.photoPickerSelected]}>
              <Text style={styles.photoGlyph}>{proof ? '✓' : '📷'}</Text>
              <Text style={styles.photoTitle}>{proof ? 'Foto siap dikirim' : 'Pilih foto bukti'}</Text>
              <Text style={styles.photoHint}>{proof ? `${Math.max(1, Math.round(proof.sizeBytes / 1024))} KB · ${proof.mimeType}` : 'JPG, PNG, atau WEBP · maksimal 6 MB'}</Text>
            </Pressable>
            <FieldLabel text="Catatan (opsional)" />
            <TextInput value={note} onChangeText={setNote} maxLength={500} multiline textAlignVertical="top" placeholder="Tambahkan penjelasan singkat..." placeholderTextColor={colors.textSubtle} style={[styles.input, styles.noteInput]} />
            {localError ? <View style={styles.validationBox}><Text style={styles.validationText}>{localError}</Text></View> : null}
            <Pressable disabled={saving} onPress={() => submit().catch(() => undefined)} style={[styles.primaryButton, saving && styles.disabled]}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Kirim untuk Persetujuan</Text>}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function RejectModal({
  visible,
  submission,
  saving,
  onClose,
  onReject,
}: {
  visible: boolean;
  submission: RoutineSubmission | null;
  saving: boolean;
  onClose: () => void;
  onReject: (note: string) => Promise<boolean>;
}) {
  const [note, setNote] = useState('');
  const [validation, setValidation] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setNote('');
      setValidation(null);
    }
  }, [submission?.id, visible]);

  const submit = async () => {
    if (!note.trim()) {
      setValidation('Alasan penolakan wajib diisi agar anggota tahu yang perlu diperbaiki.');
      return;
    }
    setValidation(null);
    await onReject(note.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.centerBackdrop}>
        <View style={styles.dialogCard}>
          <Text style={styles.dialogTitle}>Tolak bukti?</Text>
          <Text style={styles.dialogText}>Berikan alasan singkat agar anggota dapat mengirim ulang bukti yang benar.</Text>
          <TextInput value={note} onChangeText={setNote} maxLength={500} multiline textAlignVertical="top" placeholder="Contoh: Foto belum memperlihatkan hasil akhir." placeholderTextColor={colors.textSubtle} style={[styles.input, styles.noteInput]} />
          {validation ? <Text style={styles.dialogError}>{validation}</Text> : null}
          <View style={styles.dialogActions}>
            <Pressable disabled={saving} onPress={onClose} style={styles.dialogCancel}><Text style={styles.dialogCancelText}>Batal</Text></Pressable>
            <Pressable disabled={saving} onPress={() => submit().catch(() => undefined)} style={styles.dialogReject}><Text style={styles.dialogRejectText}>Tolak Bukti</Text></Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Choice({active, label, onPress}: {active: boolean; label: string; onPress: () => void}) {
  return (
    <Pressable onPress={onPress} style={[styles.choice, active && styles.choiceActive]}>
      <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text>
    </Pressable>
  );
}

function FieldLabel({text}: {text: string}) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  content: {padding: spacing.xl, paddingBottom: 132, gap: spacing.lg},
  topBar: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  identity: {alignItems: 'flex-end', maxWidth: '58%'},
  identityName: {fontSize: 15, fontWeight: '800', color: colors.text},
  identityRole: {fontSize: 11, color: colors.textMuted, marginTop: 2},
  hero: {minHeight: 130, borderRadius: radius.xl, backgroundColor: colors.primaryStrong, padding: spacing.xxl, flexDirection: 'row', alignItems: 'center', overflow: 'hidden'},
  heroTextWrap: {flex: 1, paddingRight: spacing.lg},
  heroTitle: {fontSize: 23, fontWeight: '900', color: '#FFFFFF'},
  heroSubtitle: {fontSize: 12, lineHeight: 18, color: '#E5FFF6', marginTop: 7},
  heroBadge: {width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center'},
  heroGlyph: {fontSize: 38, fontWeight: '900', color: '#FFFFFF'},
  dateCard: {...shadows.sm, borderRadius: radius.lg, backgroundColor: colors.surface, padding: spacing.md, flexDirection: 'row', alignItems: 'center'},
  dateArrow: {width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center'},
  dateArrowText: {fontSize: 28, color: colors.primaryDark, lineHeight: 30},
  dateCenter: {flex: 1, alignItems: 'center', paddingHorizontal: spacing.sm},
  dateLabel: {fontSize: 13, fontWeight: '800', color: colors.text, textTransform: 'capitalize', textAlign: 'center'},
  todayAction: {fontSize: 10, fontWeight: '800', color: colors.primaryDark, marginTop: 4},
  todayBadge: {fontSize: 10, color: colors.textMuted, marginTop: 4},
  statsRow: {flexDirection: 'row', gap: 8},
  statCard: {flex: 1, minHeight: 72, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', justifyContent: 'center'},
  statGreen: {backgroundColor: colors.successSoft},
  statBlue: {backgroundColor: colors.infoSoft},
  statYellow: {backgroundColor: colors.warningSoft},
  statGray: {backgroundColor: colors.surfaceMuted},
  statValue: {fontSize: 18, fontWeight: '900', color: colors.text},
  statLabel: {fontSize: 9, color: colors.textMuted, marginTop: 2, textAlign: 'center'},
  tabs: {flexDirection: 'row', borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, padding: 4},
  tab: {flex: 1, minHeight: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center'},
  tabActive: {backgroundColor: colors.surface, ...shadows.sm},
  tabText: {fontSize: 11, fontWeight: '800', color: colors.textMuted},
  tabTextActive: {color: colors.primaryDark},
  errorCard: {borderRadius: radius.md, backgroundColor: colors.dangerSoft, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 12},
  errorText: {flex: 1, fontSize: 12, lineHeight: 18, color: colors.danger},
  errorAction: {fontSize: 12, fontWeight: '900', color: colors.danger},
  loadingCard: {borderRadius: radius.lg, backgroundColor: colors.surface, padding: spacing.xxl, alignItems: 'center', gap: 10},
  loadingText: {fontSize: 12, color: colors.textMuted},
  section: {gap: spacing.md},
  sectionHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md},
  sectionTitle: {fontSize: 19, fontWeight: '900', color: colors.text},
  sectionSubtitle: {fontSize: 11, color: colors.textMuted, marginTop: 3},
  addButton: {borderRadius: radius.pill, backgroundColor: colors.primarySoft, paddingHorizontal: 15, paddingVertical: 9},
  addButtonText: {fontSize: 11, fontWeight: '900', color: colors.primaryDark},
  emptyCard: {...shadows.sm, borderRadius: radius.lg, backgroundColor: colors.surface, padding: spacing.xxl, alignItems: 'center'},
  emptyIcon: {width: 58, height: 58, borderRadius: 29, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center'},
  emptyGlyph: {fontSize: 28, color: colors.primaryDark, fontWeight: '900'},
  emptyTitle: {fontSize: 16, fontWeight: '900', color: colors.text, marginTop: 14},
  emptyText: {fontSize: 12, lineHeight: 18, color: colors.textMuted, textAlign: 'center', marginTop: 5},
  emptyButton: {marginTop: spacing.lg, borderRadius: radius.pill, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 11},
  emptyButtonText: {fontSize: 12, fontWeight: '900', color: '#FFFFFF'},
  routineCard: {...shadows.sm, borderRadius: radius.lg, backgroundColor: colors.surface, padding: spacing.lg},
  routineTop: {flexDirection: 'row', alignItems: 'center', gap: 10},
  routineIcon: {width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center'},
  routineIconText: {fontSize: 20, fontWeight: '900', color: colors.primaryDark},
  routineTitleWrap: {flex: 1},
  routineTitle: {fontSize: 15, fontWeight: '900', color: colors.text},
  routineSchedule: {fontSize: 10, color: colors.textMuted, marginTop: 2},
  routineActions: {flexDirection: 'row'},
  smallAction: {paddingHorizontal: 6, paddingVertical: 6},
  editText: {fontSize: 10, fontWeight: '800', color: colors.primaryDark},
  deleteText: {fontSize: 10, fontWeight: '800', color: colors.danger},
  routineDescription: {fontSize: 12, lineHeight: 18, color: colors.textMuted, marginTop: 12},
  metaGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12},
  metaPill: {borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, paddingHorizontal: 9, paddingVertical: 6},
  metaText: {fontSize: 9, fontWeight: '700', color: colors.textSecondary},
  submissionArea: {marginTop: 14, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12},
  statusPill: {alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6},
  statusApproved: {backgroundColor: colors.successSoft},
  statusPending: {backgroundColor: colors.warningSoft},
  statusRejected: {backgroundColor: colors.dangerSoft},
  statusEmpty: {backgroundColor: colors.surfaceMuted},
  statusText: {fontSize: 10, fontWeight: '900', color: colors.textSecondary},
  reviewNote: {fontSize: 11, lineHeight: 17, color: colors.dangerDark, marginTop: 8},
  proofNote: {fontSize: 11, fontStyle: 'italic', lineHeight: 17, color: colors.textMuted, marginTop: 7},
  submitProofButton: {marginTop: 12, minHeight: 43, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center'},
  submitProofButtonText: {fontSize: 12, fontWeight: '900', color: '#FFFFFF'},
  futureHint: {fontSize: 10, color: colors.textMuted, marginTop: 8},
  approvalCard: {...shadows.sm, borderRadius: radius.lg, backgroundColor: colors.surface, padding: spacing.lg},
  approvalHeader: {flexDirection: 'row', alignItems: 'center', gap: 10},
  avatarCircle: {width: 42, height: 42, borderRadius: 21, backgroundColor: colors.infoSoft, alignItems: 'center', justifyContent: 'center'},
  avatarText: {fontSize: 15, fontWeight: '900', color: colors.info},
  approvalIdentity: {flex: 1},
  approvalName: {fontSize: 14, fontWeight: '900', color: colors.text},
  approvalRoutine: {fontSize: 10, color: colors.textMuted, marginTop: 2},
  proofImage: {width: '100%', height: 190, borderRadius: radius.md, marginTop: 14, backgroundColor: colors.surfaceMuted},
  proofPlaceholder: {height: 88, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, marginTop: 14, alignItems: 'center', justifyContent: 'center'},
  proofPlaceholderText: {fontSize: 12, fontWeight: '800', color: colors.textMuted},
  approvalNote: {fontSize: 11, lineHeight: 17, color: colors.textMuted, marginTop: 10},
  selfApprovalWarning: {marginTop: 12, borderRadius: radius.md, backgroundColor: colors.warningSoft, padding: spacing.md},
  selfApprovalText: {fontSize: 10, lineHeight: 16, color: colors.warningDark},
  reviewActions: {flexDirection: 'row', gap: 10, marginTop: 14},
  rejectButton: {flex: 1, minHeight: 44, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.danger, alignItems: 'center', justifyContent: 'center'},
  rejectButtonText: {fontSize: 12, fontWeight: '900', color: colors.danger},
  approveButton: {flex: 1, minHeight: 44, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center'},
  approveButtonText: {fontSize: 12, fontWeight: '900', color: '#FFFFFF'},
  fab: {...shadows.lg, position: 'absolute', right: 22, bottom: 92, width: 62, height: 62, borderRadius: 31, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center'},
  fabText: {fontSize: 34, lineHeight: 36, fontWeight: '300', color: '#FFFFFF'},
  modalBackdrop: {flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay},
  modalSheet: {maxHeight: '94%', borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.surface, paddingTop: 10},
  compactSheet: {borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.surface, paddingTop: 10},
  modalHandle: {alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong},
  modalHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md},
  modalTitle: {fontSize: 20, fontWeight: '900', color: colors.text},
  modalSubtitle: {fontSize: 10, color: colors.textMuted, marginTop: 4},
  closeButton: {width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center'},
  closeText: {fontSize: 25, lineHeight: 27, color: colors.textMuted},
  modalContent: {paddingHorizontal: spacing.xl, paddingBottom: 40},
  proofContent: {paddingHorizontal: spacing.xl, paddingBottom: 34},
  fieldLabel: {fontSize: 12, fontWeight: '800', color: colors.text, marginTop: 16, marginBottom: 7},
  input: {minHeight: 52, borderWidth: 1.3, borderColor: colors.borderStrong, borderRadius: radius.md, paddingHorizontal: spacing.lg, color: colors.text, backgroundColor: colors.backgroundElevated, fontSize: 13},
  multilineInput: {height: 92, paddingTop: 13},
  noteInput: {height: 84, paddingTop: 13},
  choiceRow: {flexDirection: 'row', gap: 8},
  choice: {flex: 1, minHeight: 42, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center'},
  choiceActive: {backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary},
  choiceText: {fontSize: 11, fontWeight: '800', color: colors.textMuted},
  choiceTextActive: {color: colors.primaryDark},
  weekdayRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10},
  weekdayChip: {minWidth: 42, minHeight: 38, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center'},
  weekdayChipActive: {backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary},
  weekdayText: {fontSize: 10, fontWeight: '800', color: colors.textMuted},
  weekdayTextActive: {color: colors.primaryDark},
  twoColumns: {flexDirection: 'row', gap: 10},
  column: {flex: 1},
  memberList: {gap: 8},
  memberOption: {minHeight: 60, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 10},
  memberOptionActive: {borderColor: colors.primary, backgroundColor: colors.primarySoft},
  memberAvatar: {width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center'},
  memberAvatarText: {fontSize: 13, fontWeight: '900', color: colors.primaryDark},
  memberTextWrap: {flex: 1},
  memberName: {fontSize: 12, fontWeight: '900', color: colors.text},
  memberRole: {fontSize: 9, color: colors.textMuted, marginTop: 2},
  checkCircle: {width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center'},
  checkCircleActive: {backgroundColor: colors.primary, borderColor: colors.primary},
  checkMark: {fontSize: 13, fontWeight: '900', color: '#FFFFFF'},
  switchRow: {marginTop: 16, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 12},
  switchTextWrap: {flex: 1},
  switchTitle: {fontSize: 12, fontWeight: '900', color: colors.text},
  switchHint: {fontSize: 9, lineHeight: 14, color: colors.textMuted, marginTop: 3},
  validationBox: {marginTop: 16, borderRadius: radius.md, backgroundColor: colors.dangerSoft, padding: spacing.md},
  validationText: {fontSize: 11, lineHeight: 17, color: colors.danger, fontWeight: '700'},
  primaryButton: {marginTop: 22, minHeight: 54, borderRadius: radius.pill, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center'},
  primaryButtonText: {fontSize: 13, fontWeight: '900', color: '#FFFFFF'},
  disabled: {opacity: 0.6},
  photoPicker: {borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.borderStrong, backgroundColor: colors.backgroundElevated, padding: spacing.xxl, alignItems: 'center'},
  photoPickerSelected: {borderStyle: 'solid', borderColor: colors.primary, backgroundColor: colors.primarySoft},
  photoGlyph: {fontSize: 30},
  photoTitle: {fontSize: 13, fontWeight: '900', color: colors.text, marginTop: 8},
  photoHint: {fontSize: 10, color: colors.textMuted, marginTop: 4, textAlign: 'center'},
  centerBackdrop: {flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.xl},
  dialogCard: {width: '100%', borderRadius: radius.xl, backgroundColor: colors.surface, padding: spacing.xl},
  dialogTitle: {fontSize: 19, fontWeight: '900', color: colors.text},
  dialogText: {fontSize: 11, lineHeight: 17, color: colors.textMuted, marginTop: 6, marginBottom: 4},
  dialogError: {fontSize: 10, color: colors.danger, marginTop: 7},
  dialogActions: {flexDirection: 'row', gap: 10, marginTop: 18},
  dialogCancel: {flex: 1, minHeight: 44, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center'},
  dialogCancelText: {fontSize: 12, fontWeight: '900', color: colors.textMuted},
  dialogReject: {flex: 1, minHeight: 44, borderRadius: radius.pill, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center'},
  dialogRejectText: {fontSize: 12, fontWeight: '900', color: '#FFFFFF'},
});
