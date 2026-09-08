import type {AgendaEntry} from '../src/features/agenda/types';
import {
  agendaEditorInitialState,
  buildAgendaDraft,
} from '../src/features/agenda/utils/editor';

describe('agenda editor helpers', () => {
  it('builds a categorized agenda draft with the fixed five-minute reminder', () => {
    const selectedDate = new Date(2026, 8, 8);
    const nowMs = new Date(2026, 8, 8, 7, 0, 0, 0).getTime();

    const result = buildAgendaDraft(
      selectedDate,
      {
        title: 'Rapat keluarga',
        category: 'business',
        location: 'Rumah',
        notes: 'Bahas agenda pekan ini',
        startTime: '09:00',
        endTime: '10:00',
        reminderEnabled: true,
        reminderMinutes: 30,
        status: 'scheduled',
      },
      nowMs,
    );

    expect(result.error).toBeNull();
    expect(result.draft).not.toBeNull();
    expect(result.draft?.category).toBe('business');
    expect(result.draft?.title).toBe('Rapat keluarga');
    expect(result.draft?.reminderEnabled).toBe(true);

    const startsAt = new Date(result.draft!.startsAt).getTime();
    const reminderAt = new Date(result.draft!.reminderAt!).getTime();
    expect(startsAt - reminderAt).toBe(5 * 60_000);
  });

  it('rejects an end time that is not after start time', () => {
    const result = buildAgendaDraft(
      new Date(2026, 8, 8),
      {
        title: 'Rapat keluarga',
        category: 'work',
        location: '',
        notes: '',
        startTime: '10:00',
        endTime: '09:30',
        reminderEnabled: false,
        reminderMinutes: 5,
        status: 'scheduled',
      },
      new Date(2026, 8, 8, 7, 0).getTime(),
    );

    expect(result.draft).toBeNull();
    expect(result.error).toBe('Jam selesai harus setelah jam mulai.');
  });

  it('turns reminder off for completed agenda', () => {
    const result = buildAgendaDraft(
      new Date(2026, 8, 8),
      {
        title: 'Agenda selesai',
        category: 'islamic',
        location: '',
        notes: '',
        startTime: '09:00',
        endTime: '',
        reminderEnabled: true,
        reminderMinutes: 5,
        status: 'completed',
      },
      new Date(2026, 8, 8, 12, 0).getTime(),
    );

    expect(result.error).toBeNull();
    expect(result.draft?.reminderEnabled).toBe(false);
    expect(result.draft?.reminderAt).toBeNull();
  });

  it('hydrates category and normalizes reminder to five minutes when editing', () => {
    const entry: AgendaEntry = {
      id: 'agenda-1',
      familyId: 'family-1',
      createdBy: 'user-1',
      title: 'Kajian keluarga',
      category: 'islamic',
      notes: null,
      location: 'Masjid',
      startsAt: new Date(2026, 8, 8, 18, 30).toISOString(),
      endsAt: new Date(2026, 8, 8, 20, 0).toISOString(),
      reminderEnabled: true,
      reminderAt: new Date(2026, 8, 8, 18, 20).toISOString(),
      status: 'scheduled',
      createdAt: new Date(2026, 8, 1).toISOString(),
      updatedAt: new Date(2026, 8, 1).toISOString(),
    };

    const initial = agendaEditorInitialState(new Date(2026, 8, 8), entry);
    expect(initial.category).toBe('islamic');
    expect(initial.reminderMinutes).toBe(5);
    expect(initial.startTime).toBe('18:30');
  });
});
