import type {FinanceTransaction} from '../src/features/finance/types';
import {
  calculateFinanceSummary,
  groupTransactions,
  parseRupiahInput,
  validateFinanceDraft,
} from '../src/features/finance/utils/finance';

function transaction(
  id: string,
  type: 'income' | 'expense',
  amount: number,
  occurredOn: string,
): FinanceTransaction {
  return {
    id,
    familyId: 'family-1',
    createdBy: 'user-1',
    type,
    amount,
    category: type === 'income' ? 'Gaji' : 'Kebutuhan Rumah',
    note: null,
    occurredOn,
    createdAt: `${occurredOn}T10:00:00.000Z`,
    updatedAt: `${occurredOn}T10:00:00.000Z`,
  };
}

describe('UangQu finance helpers', () => {
  it('keeps lifetime balance while calculating current month and year periods', () => {
    const items = [
      transaction('1', 'income', 5_000_000, '2026-09-01'),
      transaction('2', 'expense', 1_250_000, '2026-09-05'),
      transaction('3', 'income', 2_000_000, '2026-08-20'),
      transaction('4', 'expense', 500_000, '2025-12-20'),
    ];

    const summary = calculateFinanceSummary(items, new Date(2026, 8, 8));

    expect(summary.balance).toBe(5_250_000);
    expect(summary.monthly).toEqual({income: 5_000_000, expense: 1_250_000, net: 3_750_000});
    expect(summary.yearly).toEqual({income: 7_000_000, expense: 1_250_000, net: 5_750_000});
    expect(summary.allTime).toEqual({income: 7_000_000, expense: 1_750_000, net: 5_250_000});
  });

  it('groups history newest date first', () => {
    const groups = groupTransactions([
      transaction('1', 'income', 100, '2026-09-07'),
      transaction('2', 'expense', 50, '2026-09-08'),
      transaction('3', 'expense', 25, '2026-09-08'),
    ]);

    expect(groups.map(group => group.dateKey)).toEqual(['2026-09-08', '2026-09-07']);
    expect(groups[0].items).toHaveLength(2);
  });

  it('parses formatted rupiah input safely', () => {
    expect(parseRupiahInput('Rp 1.250.000')).toBe(1_250_000);
    expect(parseRupiahInput('')).toBe(0);
  });

  it('rejects future dates and zero amount', () => {
    expect(
      validateFinanceDraft(
        {type: 'expense', amount: 100_000, category: 'Tagihan', note: null, occurredOn: '2026-09-09'},
        '2026-09-08',
      ),
    ).toBe('Tanggal transaksi tidak boleh berada di masa depan.');

    expect(
      validateFinanceDraft(
        {type: 'expense', amount: 0, category: 'Tagihan', note: null, occurredOn: '2026-09-08'},
        '2026-09-08',
      ),
    ).toBe('Nominal harus lebih dari Rp 0.');
  });
});
