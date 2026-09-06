import {getSupabaseClient} from '../../../lib/supabase/client';
import type {AgendaDraft, AgendaEntry, AgendaStatus} from '../types';

type AgendaRow = {
  id: string;
  family_id: string;
  created_by: string;
  title: string;
  notes: string | null;
  location: string | null;
  starts_at: string;
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
    notes: row.notes,
    location: row.location,
    startsAt: row.starts_at,
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
    notes: draft.notes?.trim() || null,
    location: draft.location?.trim() || null,
    starts_at: draft.startsAt,
    reminder_enabled: draft.reminderEnabled,
    reminder_at: draft.reminderEnabled ? draft.reminderAt ?? draft.startsAt : null,
    status: draft.status ?? 'scheduled',
  };
}

export const agendaService = {
  async listRange(familyId: string, startIso: string, endIso: string): Promise<AgendaEntry[]> {
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

  async listUpcoming(familyId: string, fromIso: string, limit = 2): Promise<AgendaEntry[]> {
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

  async create(familyId: string, userId: string, draft: AgendaDraft): Promise<AgendaEntry> {
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
    const {error} = await getSupabaseClient().from('agenda_entries').delete().eq('id', id);
    if (error) {
      throw error;
    }
  },
};
