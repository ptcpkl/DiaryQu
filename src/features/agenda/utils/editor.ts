import type {
  AgendaCategory,
  AgendaDraft,
  AgendaEntry,
  AgendaStatus,
} from '../types';
import {
  combineLocalDateAndTime,
  dateKey,
  formatTime,
} from './date';

export const AGENDA_REMINDER_MINUTES = 5;
export const REMINDER_OPTIONS = [AGENDA_REMINDER_MINUTES] as const;

export type AgendaEditorValues = {
  title: string;
  category: AgendaCategory;
  location: string;
  notes: string;
  startTime: string;
  endTime: string;
  reminderEnabled: boolean;
  reminderMinutes: number;
  status: AgendaStatus;
};

export type AgendaDraftResult =
  | {draft: AgendaDraft; error: null}
  | {draft: null; error: string};

function editorTime(iso: string): string {
  return formatTime(iso).replace(/\./g, ':');
}

export function agendaEditorInitialState(
  selectedDate: Date,
  entry: AgendaEntry | null,
): AgendaEditorValues {
  if (entry) {
    return {
      title: entry.title,
      category: entry.category ?? 'work',
      location: entry.location ?? '',
      notes: entry.notes ?? '',
      startTime: editorTime(entry.startsAt),
      endTime: entry.endsAt ? editorTime(entry.endsAt) : '',
      reminderEnabled: entry.reminderEnabled,
      reminderMinutes: AGENDA_REMINDER_MINUTES,
      status: entry.status,
    };
  }

  const now = new Date();
  const sameDay = dateKey(now) === dateKey(selectedDate);
  const startHour = sameDay ? Math.min(23, now.getHours() + 1) : 9;
  const endHour = Math.min(23, startHour + 1);

  return {
    title: '',
    category: 'work',
    location: '',
    notes: '',
    startTime: `${String(startHour).padStart(2, '0')}:00`,
    endTime: `${String(endHour).padStart(2, '0')}:00`,
    reminderEnabled: true,
    reminderMinutes: AGENDA_REMINDER_MINUTES,
    status: 'scheduled',
  };
}

export function buildAgendaDraft(
  selectedDate: Date,
  values: AgendaEditorValues,
  nowMs = Date.now(),
): AgendaDraftResult {
  const title = values.title.trim();
  const start = combineLocalDateAndTime(selectedDate, values.startTime);
  const end = values.endTime.trim()
    ? combineLocalDateAndTime(selectedDate, values.endTime)
    : null;

  if (title.length < 2) {
    return {draft: null, error: 'Judul agenda minimal 2 karakter.'};
  }
  if (!start) {
    return {
      draft: null,
      error: 'Jam mulai harus menggunakan format HH:mm, contoh 09:30.',
    };
  }
  if (values.endTime.trim() && !end) {
    return {
      draft: null,
      error: 'Jam selesai belum valid. Gunakan format HH:mm.',
    };
  }
  if (end && end.getTime() <= start.getTime()) {
    return {
      draft: null,
      error: 'Jam selesai harus setelah jam mulai.',
    };
  }

  const effectiveReminder =
    values.reminderEnabled && values.status !== 'completed';
  const reminderAt = effectiveReminder
    ? new Date(start.getTime() - AGENDA_REMINDER_MINUTES * 60_000)
    : null;

  if (effectiveReminder && reminderAt && reminderAt.getTime() <= nowMs) {
    return {
      draft: null,
      error: 'Agenda dengan reminder harus dimulai lebih dari 5 menit dari sekarang.',
    };
  }

  return {
    draft: {
      title,
      category: values.category,
      location: values.location.trim() || null,
      notes: values.notes.trim() || null,
      startsAt: start.toISOString(),
      endsAt: end?.toISOString() ?? null,
      reminderEnabled: effectiveReminder,
      reminderAt: effectiveReminder ? reminderAt?.toISOString() ?? null : null,
      status: values.status,
    },
    error: null,
  };
}
