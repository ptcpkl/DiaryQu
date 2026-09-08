import type {RoutineDefinition, RoutineDraft, RoutineSubmission} from '../src/features/routines/types';
import {
  localDateKey,
  routineOccursOn,
  routineStats,
  validateRoutineDraft,
} from '../src/features/routines/utils/schedule';

const routine = (overrides: Partial<RoutineDefinition> = {}): RoutineDefinition => ({
  id: 'routine-1',
  familyId: 'family-1',
  createdBy: 'head-1',
  title: 'Rapikan kamar',
  description: null,
  scheduleType: 'daily',
  weekdays: [],
  startDate: '2026-09-01',
  endDate: null,
  rewardPoints: 10,
  proofRequired: true,
  isActive: true,
  assigneeIds: ['member-1'],
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  ...overrides,
});

const submission = (overrides: Partial<RoutineSubmission> = {}): RoutineSubmission => ({
  id: 'submission-1',
  routineId: 'routine-1',
  familyId: 'family-1',
  memberId: 'member-1',
  occurrenceDate: '2026-09-08',
  proofPath: 'family-1/member-1/routine-1/2026-09-08/proof',
  proofMime: 'image/jpeg',
  proofNote: null,
  proofUrl: null,
  status: 'approved',
  reviewNote: null,
  submittedAt: '2026-09-08T01:00:00.000Z',
  reviewedBy: 'head-1',
  reviewedAt: '2026-09-08T02:00:00.000Z',
  updatedAt: '2026-09-08T02:00:00.000Z',
  ...overrides,
});

describe('routine schedule helpers', () => {
  it('builds a stable local date key', () => {
    expect(localDateKey(new Date(2026, 8, 8, 22, 30))).toBe('2026-09-08');
  });

  it('supports daily and selected-weekday recurrence', () => {
    const tuesday = new Date(2026, 8, 8);
    expect(routineOccursOn(routine(), tuesday)).toBe(true);
    expect(
      routineOccursOn(
        routine({scheduleType: 'weekly', weekdays: [2, 4]}),
        tuesday,
      ),
    ).toBe(true);
    expect(
      routineOccursOn(
        routine({scheduleType: 'weekly', weekdays: [1, 3, 5]}),
        tuesday,
      ),
    ).toBe(false);
  });

  it('respects active state and date boundaries', () => {
    expect(routineOccursOn(routine({isActive: false}), new Date(2026, 8, 8))).toBe(false);
    expect(
      routineOccursOn(routine({endDate: '2026-09-07'}), new Date(2026, 8, 8)),
    ).toBe(false);
  });

  it('validates assignments and weekly days', () => {
    const draft: RoutineDraft = {
      title: 'Olahraga',
      description: null,
      scheduleType: 'weekly',
      weekdays: [],
      startDate: '2026-09-08',
      endDate: null,
      rewardPoints: 5,
      proofRequired: false,
      isActive: true,
      assigneeIds: [],
    };

    expect(validateRoutineDraft(draft)).toBe('Pilih minimal satu hari untuk rutinitas mingguan.');
    expect(validateRoutineDraft({...draft, weekdays: [2]})).toBe('Pilih minimal satu anggota keluarga.');
    expect(validateRoutineDraft({...draft, weekdays: [2], assigneeIds: ['member-1']})).toBeNull();
  });

  it('computes member and family completion progress', () => {
    const date = new Date(2026, 8, 8);
    const routines = [
      routine(),
      routine({id: 'routine-2', assigneeIds: ['member-1', 'member-2']}),
    ];
    const submissions = [submission()];

    expect(routineStats(routines, submissions, date, 'member-1', false)).toEqual({
      target: 2,
      approved: 1,
      pending: 0,
      rejected: 0,
      progress: 50,
    });
    expect(routineStats(routines, submissions, date, 'head-1', true)).toEqual({
      target: 3,
      approved: 1,
      pending: 0,
      rejected: 0,
      progress: 33,
    });
  });
});
