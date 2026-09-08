import type {RoutineDefinition, RoutineDraft, RoutineSubmission} from '../types';

export const WEEKDAY_OPTIONS = [
  {value: 1, label: 'Sen'},
  {value: 2, label: 'Sel'},
  {value: 3, label: 'Rab'},
  {value: 4, label: 'Kam'},
  {value: 5, label: 'Jum'},
  {value: 6, label: 'Sab'},
  {value: 0, label: 'Min'},
] as const;

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateFromKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key.trim());
  if (!match) {
    return null;
  }

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (localDateKey(date) !== key) {
    return null;
  }
  return date;
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function normalizeWeekdays(days: number[]): number[] {
  return [...new Set(days.filter(day => Number.isInteger(day) && day >= 0 && day <= 6))].sort(
    (a, b) => a - b,
  );
}

export function routineOccursOn(routine: RoutineDefinition, date: Date): boolean {
  if (!routine.isActive) {
    return false;
  }

  const key = localDateKey(date);
  if (key < routine.startDate || (routine.endDate && key > routine.endDate)) {
    return false;
  }

  return routine.scheduleType === 'daily' || routine.weekdays.includes(date.getDay());
}

export function routineScheduleLabel(routine: Pick<RoutineDefinition, 'scheduleType' | 'weekdays'>): string {
  if (routine.scheduleType === 'daily') {
    return 'Setiap hari';
  }

  const labels = WEEKDAY_OPTIONS.filter(option => routine.weekdays.includes(option.value)).map(
    option => option.label,
  );
  return labels.length > 0 ? labels.join(', ') : 'Belum diatur';
}

export function validateRoutineDraft(draft: RoutineDraft): string | null {
  if (draft.title.trim().length < 2) {
    return 'Nama rutinitas minimal 2 karakter.';
  }
  if (!dateFromKey(draft.startDate)) {
    return 'Tanggal mulai harus memakai format YYYY-MM-DD.';
  }
  if (draft.endDate && !dateFromKey(draft.endDate)) {
    return 'Tanggal selesai harus memakai format YYYY-MM-DD.';
  }
  if (draft.endDate && draft.endDate < draft.startDate) {
    return 'Tanggal selesai tidak boleh sebelum tanggal mulai.';
  }
  if (draft.scheduleType === 'weekly' && normalizeWeekdays(draft.weekdays).length === 0) {
    return 'Pilih minimal satu hari untuk rutinitas mingguan.';
  }
  if (!Number.isInteger(draft.rewardPoints) || draft.rewardPoints < 0 || draft.rewardPoints > 100000) {
    return 'Poin hadiah harus berupa angka 0 sampai 100000.';
  }
  if (draft.assigneeIds.length === 0) {
    return 'Pilih minimal satu anggota keluarga.';
  }
  return null;
}

export function submissionFor(
  submissions: RoutineSubmission[],
  routineId: string,
  memberId: string,
  occurrenceDate: string,
): RoutineSubmission | null {
  return (
    submissions.find(
      item =>
        item.routineId === routineId &&
        item.memberId === memberId &&
        item.occurrenceDate === occurrenceDate,
    ) ?? null
  );
}

export function routineStats(
  routines: RoutineDefinition[],
  submissions: RoutineSubmission[],
  date: Date,
  userId: string,
  includeFamily = false,
) {
  const dateKey = localDateKey(date);
  const due = routines.filter(
    routine =>
      routineOccursOn(routine, date) && (includeFamily || routine.assigneeIds.includes(userId)),
  );

  const relevant = submissions.filter(
    submission =>
      submission.occurrenceDate === dateKey &&
      due.some(routine => routine.id === submission.routineId) &&
      (includeFamily || submission.memberId === userId),
  );

  const approved = relevant.filter(item => item.status === 'approved').length;
  const pending = relevant.filter(item => item.status === 'pending').length;
  const rejected = relevant.filter(item => item.status === 'rejected').length;
  const target = includeFamily
    ? due.reduce((count, routine) => count + routine.assigneeIds.length, 0)
    : due.length;

  return {
    target,
    approved,
    pending,
    rejected,
    progress: target === 0 ? 0 : Math.round((approved / target) * 100),
  };
}
