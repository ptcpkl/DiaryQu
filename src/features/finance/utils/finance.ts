import type {
  FinanceBill,
  FinanceBillDraft,
  FinanceBillSummary,
  FinanceSummary,
  FinanceTransaction,
  FinanceTransactionDraft,
  FinanceTransactionGroup,
} from '../types';

export const INCOME_CATEGORIES = [
  'Gaji',
  'Bisnis',
  'Bonus',
  'Investasi',
  'Hadiah',
  'Lainnya',
] as const;

export const EXPENSE_CATEGORIES = [
  'Belanja Bulanan',
  'Makan & Minuman',
  'Kebutuhan Rumah',
  'Transportasi',
  'Pendidikan',
  'Kesehatan',
  'Sedekah',
  'Tagihan',
  'Lainnya',
] as const;

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function offsetDateKey(days: number, base = new Date()): string {
  const date = new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
  return localDateKey(date);
}

export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

export function formatRupiah(value: number): string {
  const safe = Number.isFinite(value) ? Math.round(value) : 0;
  return `Rp ${Math.abs(safe).toLocaleString('id-ID')}`;
}

export function parseRupiahInput(value: string): number {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 0;
  const parsed = Number(digits);
  return Number.isSafeInteger(parsed) ? parsed : 0;
}

export function formatDateHeading(dateKey: string): string {
  if (!isValidDateKey(dateKey)) return dateKey;
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function emptyTotals() {
  return {income: 0, expense: 0, net: 0};
}

function addTransaction(
  totals: ReturnType<typeof emptyTotals>,
  transaction: FinanceTransaction,
) {
  if (transaction.type === 'income') totals.income += transaction.amount;
  else totals.expense += transaction.amount;
  totals.net = totals.income - totals.expense;
}

export function calculateFinanceSummary(
  transactions: FinanceTransaction[],
  now = new Date(),
): FinanceSummary {
  const allTime = emptyTotals();
  const monthly = emptyTotals();
  const yearly = emptyTotals();
  const yearKey = String(now.getFullYear());
  const monthKey = `${yearKey}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  transactions.forEach(transaction => {
    addTransaction(allTime, transaction);
    if (transaction.occurredOn.startsWith(yearKey)) addTransaction(yearly, transaction);
    if (transaction.occurredOn.startsWith(monthKey)) addTransaction(monthly, transaction);
  });

  return {balance: allTime.net, allTime, monthly, yearly};
}

export function calculateBillSummary(
  bills: FinanceBill[],
  now = new Date(),
): FinanceBillSummary {
  const activeBills = bills.filter(bill => bill.isActive);
  const today = now.getDate();
  return {
    activeCount: activeBills.length,
    monthlyTotal: activeBills.reduce((total, bill) => total + bill.amount, 0),
    dueSoonCount: activeBills.filter(bill => bill.dueDay >= today && bill.dueDay <= today + 7).length,
  };
}

export function formatBillDueDay(dueDay: number): string {
  return `Tanggal ${Math.min(31, Math.max(1, Math.round(dueDay)))}`;
}

export function groupTransactions(
  transactions: FinanceTransaction[],
): FinanceTransactionGroup[] {
  const sorted = [...transactions].sort((a, b) => {
    const dateCompare = b.occurredOn.localeCompare(a.occurredOn);
    if (dateCompare !== 0) return dateCompare;
    return b.createdAt.localeCompare(a.createdAt);
  });
  const groups = new Map<string, FinanceTransaction[]>();
  sorted.forEach(transaction => {
    const current = groups.get(transaction.occurredOn) ?? [];
    current.push(transaction);
    groups.set(transaction.occurredOn, current);
  });
  return Array.from(groups, ([dateKey, items]) => ({dateKey, items}));
}

export function validateFinanceDraft(
  draft: FinanceTransactionDraft,
  todayKey = localDateKey(),
): string | null {
  if (!Number.isSafeInteger(draft.amount) || draft.amount <= 0) {
    return 'Nominal harus lebih dari Rp 0.';
  }
  if (draft.amount > 9_000_000_000_000) {
    return 'Nominal transaksi terlalu besar.';
  }
  if (draft.category.trim().length < 2) {
    return 'Pilih kategori transaksi.';
  }
  if (!isValidDateKey(draft.occurredOn)) {
    return 'Tanggal transaksi harus menggunakan format YYYY-MM-DD.';
  }
  if (draft.occurredOn > todayKey) {
    return 'Tanggal transaksi tidak boleh berada di masa depan.';
  }
  if ((draft.note?.length ?? 0) > 500) {
    return 'Catatan maksimal 500 karakter.';
  }
  return null;
}

export function validateFinanceBillDraft(draft: FinanceBillDraft): string | null {
  if (draft.title.trim().length < 2) return 'Nama tagihan minimal 2 karakter.';
  if (!Number.isSafeInteger(draft.amount) || draft.amount <= 0) {
    return 'Nominal tagihan harus lebih dari Rp 0.';
  }
  if (draft.amount > 9_000_000_000_000) return 'Nominal tagihan terlalu besar.';
  if (!Number.isInteger(draft.dueDay) || draft.dueDay < 1 || draft.dueDay > 31) {
    return 'Tanggal jatuh tempo harus antara 1 sampai 31.';
  }
  if ((draft.note?.length ?? 0) > 500) return 'Catatan tagihan maksimal 500 karakter.';
  return null;
}
