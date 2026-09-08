import {FRONTEND_DEMO_MODE} from '../../../config/appMode';
import {getSupabaseClient} from '../../../lib/supabase/client';
import {DEMO_FAMILY_ID, DEMO_USER_ID} from '../../../mocks/demoData';
import type {
  AgendaCategory,
  AgendaDraft,
  AgendaEntry,
  AgendaStatus,
} from '../types';

type AgendaRow = {
  id: string;
  family_id: string;
  created_by: string;
  title: string;
  category: AgendaCategory;
  notes: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  reminder_enabled: boolean;
  reminder_at: string | null;
  status: AgendaStatus;
  created_at: string;
  updated_at: string;
};

function toEntry(row: AgendaRow): AgendaEntry {
  return {
    id: row.id,
    familyId: row.family_id,
    createdBy: row.created_by,
    title: row.title,
    category: row.category ?? 'work',
    notes: row.notes,
    location: row.location,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    reminderEnabled: row.reminder_enabled,
    reminderAt: row.reminder_at,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPayload(draft: AgendaDraft) {
  return {
    title: draft.title.trim(),
    category: draft.category ?? 'work',
    notes: draft.notes?.trim() || null,
    location: draft.location?.trim() || null,
    starts_at: draft.startsAt,
    ends_at: draft.endsAt ?? null,
    reminder_enabled: draft.reminderEnabled,
    reminder_at: draft.reminderEnabled
      ? draft.reminderAt ?? draft.startsAt
      : null,
    status: draft.status ?? 'scheduled',
  };
}

function atLocalTime(dayOffset: number, hour: number, minute: number): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function createInitialDemoItems(): AgendaEntry[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'demo-agenda-family-review',
      familyId: DEMO_FAMILY_ID,
      createdBy: DEMO_USER_ID,
      title: 'Evaluasi agenda keluarga',
      category: 'business',
      notes: 'Cek kebutuhan keluarga untuk minggu ini.',
      location: 'Rumah',
      startsAt: atLocalTime(0, 19, 30),
      endsAt: atLocalTime(0, 20, 15),
      reminderEnabled: false,
      reminderAt: null,
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-agenda-islamic-study',
      familyId: DEMO_FAMILY_ID,
      createdBy: DEMO_USER_ID,
      title: 'Kajian keluarga',
      category: 'islamic',
      notes: 'Bawa catatan dan mushaf.',
      location: 'Masjid terdekat',
      startsAt: atLocalTime(1, 18, 30),
      endsAt: atLocalTime(1, 20, 0),
      reminderEnabled: false,
      reminderAt: null,
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

let demoItems: AgendaEntry[] | null = null;

function getDemoItems(): AgendaEntry[] {
  if (!demoItems) {
    demoItems = createInitialDemoItems();
  }
  return demoItems;
}

function createDemoId(): string {
  return `demo-agenda-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function demoDraftToEntry(
  id: string,
  familyId: string,
  userId: string,
  draft: AgendaDraft,
  createdAt: string,
): AgendaEntry {
  const now = new Date().toISOString();
  return {
    id,
    familyId,
    createdBy: userId,
    title: draft.title.trim(),
    category: draft.category ?? 'work',
    notes: draft.notes?.trim() || null,
    location: draft.location?.trim() || null,
    startsAt: draft.startsAt,
    endsAt: draft.endsAt ?? null,
    reminderEnabled: draft.reminderEnabled,
    reminderAt: draft.reminderEnabled
      ? draft.reminderAt ?? draft.startsAt
      : null,
    status: draft.status ?? 'scheduled',
    createdAt,
    updatedAt: now,
  };
}

export const agendaService = {
  async listRange(
    familyId: string,
    startIso: string,
    endIso: string,
  ): Promise<AgendaEntry[]> {
    if (FRONTEND_DEMO_MODE) {
      return getDemoItems()
        .filter(
          item =>
            item.familyId === familyId &&
            item.startsAt >= startIso &&
            item.startsAt < endIso,
        )
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    }

    const {data, error} = await getSupabaseClient()
      .from('agenda_entries')
      .select('*')
      .eq('family_id', familyId)
      .gte('starts_at', startIso)
      .lt('starts_at', endIso)
      .order('starts_at', {ascending: true});

    if (error) {
      throw error;
    }

    return ((data ?? []) as AgendaRow[]).map(toEntry);
  },

  async listUpcoming(
    familyId: string,
    fromIso: string,
    limit = 2,
  ): Promise<AgendaEntry[]> {
    if (FRONTEND_DEMO_MODE) {
      return getDemoItems()
        .filter(
          item =>
            item.familyId === familyId &&
            item.startsAt >= fromIso &&
            item.status !== 'completed',
        )
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        .slice(0, limit);
    }

    const {data, error} = await getSupabaseClient()
      .from('agenda_entries')
      .select('*')
      .eq('family_id', familyId)
      .gte('starts_at', fromIso)
      .neq('status', 'completed')
      .order('starts_at', {ascending: true})
      .limit(limit);

    if (error) {
      throw error;
    }

    return ((data ?? []) as AgendaRow[]).map(toEntry);
  },

  async create(
    familyId: string,
    userId: string,
    draft: AgendaDraft,
  ): Promise<AgendaEntry> {
    if (FRONTEND_DEMO_MODE) {
      const now = new Date().toISOString();
      const entry = demoDraftToEntry(
        createDemoId(),
        familyId,
        userId,
        draft,
        now,
      );
      demoItems = [...getDemoItems(), entry];
      return entry;
    }

    const {data, error} = await getSupabaseClient()
      .from('agenda_entries')
      .insert({family_id: familyId, created_by: userId, ...toPayload(draft)})
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return toEntry(data as AgendaRow);
  },

  async update(id: string, draft: AgendaDraft): Promise<AgendaEntry> {
    if (FRONTEND_DEMO_MODE) {
      const current = getDemoItems().find(item => item.id === id);
      if (!current) {
        throw new Error('AGENDA_NOT_FOUND');
      }
      const updated = demoDraftToEntry(
        current.id,
        current.familyId,
        current.createdBy,
        draft,
        current.createdAt,
      );
      demoItems = getDemoItems().map(item =>
        item.id === id ? updated : item,
      );
      return updated;
    }

    const {data, error} = await getSupabaseClient()
      .from('agenda_entries')
      .update(toPayload(draft))
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return toEntry(data as AgendaRow);
  },

  async remove(id: string): Promise<void> {
    if (FRONTEND_DEMO_MODE) {
      demoItems = getDemoItems().filter(item => item.id !== id);
      return;
    }

    const {error} = await getSupabaseClient()
      .from('agenda_entries')
      .delete()
      .eq('id', id);
    if (error) {
      throw error;
    }
  },
};
