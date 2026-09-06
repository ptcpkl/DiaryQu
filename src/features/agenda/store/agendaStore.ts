import {create} from 'zustand';

import {agendaReminderService} from '../services/agendaReminderService';
import {agendaService} from '../services/agendaService';
import type {AgendaDraft, AgendaEntry} from '../types';

type AgendaState = {
  items: AgendaEntry[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  reminderIsExact: boolean | null;
  loadRange: (familyId: string, startIso: string, endIso: string) => Promise<void>;
  createEntry: (familyId: string, userId: string, draft: AgendaDraft) => Promise<AgendaEntry | null>;
  updateEntry: (id: string, draft: AgendaDraft) => Promise<AgendaEntry | null>;
  removeEntry: (id: string) => Promise<boolean>;
  refreshExactAlarmStatus: () => Promise<void>;
  clearError: () => void;
};

function agendaError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const normalized = raw.toUpperCase();

  if (normalized.includes('AGENDA_ENTRIES')) {
    return 'Database Agenda belum siap. Jalankan migration Agenda di Supabase terlebih dahulu.';
  }
  if (normalized.includes('ROW-LEVEL SECURITY') || normalized.includes('42501')) {
    return 'Akun ini tidak memiliki izin untuk mengubah agenda tersebut.';
  }
  if (normalized.includes('REMINDER')) {
    return 'Reminder belum dapat dijadwalkan. Agenda tetap tersimpan.';
  }

  return 'Agenda belum dapat diproses. Silakan coba lagi.';
}

function replaceSorted(items: AgendaEntry[], entry: AgendaEntry): AgendaEntry[] {
  return [...items.filter(item => item.id !== entry.id), entry].sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt),
  );
}

export const useAgendaStore = create<AgendaState>((set, get) => ({
  items: [],
  isLoading: false,
  isSaving: false,
  error: null,
  reminderIsExact: null,

  loadRange: async (familyId, startIso, endIso) => {
    set({isLoading: true, error: null});
    try {
      const items = await agendaService.listRange(familyId, startIso, endIso);
      set({items, isLoading: false});
      await Promise.allSettled(items.map(item => agendaReminderService.schedule(item)));
    } catch (error) {
      set({items: [], isLoading: false, error: agendaError(error)});
    }
  },

  createEntry: async (familyId, userId, draft) => {
    set({isSaving: true, error: null});
    try {
      const entry = await agendaService.create(familyId, userId, draft);
      let reminderIsExact: boolean | null = get().reminderIsExact;
      try {
        const reminder = await agendaReminderService.schedule(entry);
        if (entry.reminderEnabled && reminder.scheduled) {
          reminderIsExact = reminder.exact;
        }
      } catch {
        reminderIsExact = false;
      }
      set({
        items: replaceSorted(get().items, entry),
        isSaving: false,
        reminderIsExact,
      });
      return entry;
    } catch (error) {
      set({isSaving: false, error: agendaError(error)});
      return null;
    }
  },

  updateEntry: async (id, draft) => {
    set({isSaving: true, error: null});
    try {
      const entry = await agendaService.update(id, draft);
      await agendaReminderService.cancel(id);
      let reminderIsExact: boolean | null = get().reminderIsExact;
      try {
        const reminder = await agendaReminderService.schedule(entry);
        if (entry.reminderEnabled && reminder.scheduled) {
          reminderIsExact = reminder.exact;
        }
      } catch {
        reminderIsExact = false;
      }
      set({
        items: replaceSorted(get().items, entry),
        isSaving: false,
        reminderIsExact,
      });
      return entry;
    } catch (error) {
      set({isSaving: false, error: agendaError(error)});
      return null;
    }
  },

  removeEntry: async id => {
    set({isSaving: true, error: null});
    try {
      await agendaService.remove(id);
      await agendaReminderService.cancel(id);
      set({items: get().items.filter(item => item.id !== id), isSaving: false});
      return true;
    } catch (error) {
      set({isSaving: false, error: agendaError(error)});
      return false;
    }
  },

  refreshExactAlarmStatus: async () => {
    const exact = await agendaReminderService.canScheduleExact();
    set({reminderIsExact: exact});
  },

  clearError: () => set({error: null}),
}));
