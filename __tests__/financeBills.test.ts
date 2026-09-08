import {
  calculateBillSummary,
  validateFinanceBillDraft,
} from '../src/features/finance/utils/finance';
import type {FinanceBill} from '../src/features/finance/types';

function bill(overrides: Partial<FinanceBill>): FinanceBill {
  return {
    id: 'bill-1',
    familyId: 'family-1',
    createdBy: 'user-1',
    title: 'Listrik',
    amount: 400000,
    dueDay: 10,
    note: null,
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('Finance List Tagihan', () => {
  it('summarizes only active monthly bills', () => {
    const result = calculateBillSummary(
      [
        bill({id: 'a', amount: 400000, dueDay: 10}),
        bill({id: 'b', amount: 350000, dueDay: 15}),
        bill({id: 'c', amount: 999999, dueDay: 12, isActive: false}),
      ],
      new Date(2026, 8, 8),
    );

    expect(result.activeCount).toBe(2);
    expect(result.monthlyTotal).toBe(750000);
    expect(result.dueSoonCount).toBe(2);
  });

  it('requires a valid recurring due day', () => {
    expect(validateFinanceBillDraft({
      title: 'Internet',
      amount: 350000,
      dueDay: 0,
      note: null,
      isActive: true,
    })).toContain('1 sampai 31');

    expect(validateFinanceBillDraft({
      title: 'Internet',
      amount: 350000,
      dueDay: 20,
      note: null,
      isActive: true,
    })).toBeNull();
  });
});
