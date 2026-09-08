export type FinanceTransactionType = 'income' | 'expense';

export interface FinanceTransaction {
  id: string;
  familyId: string;
  createdBy: string;
  type: FinanceTransactionType;
  amount: number;
  category: string;
  note: string | null;
  occurredOn: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceTransactionDraft {
  type: FinanceTransactionType;
  amount: number;
  category: string;
  note: string | null;
  occurredOn: string;
}

export interface FinanceBill {
  id: string;
  familyId: string;
  createdBy: string;
  title: string;
  amount: number;
  dueDay: number;
  note: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceBillDraft {
  title: string;
  amount: number;
  dueDay: number;
  note: string | null;
  isActive: boolean;
}

export interface FinancePeriodTotals {
  income: number;
  expense: number;
  net: number;
}

export interface FinanceSummary {
  balance: number;
  allTime: FinancePeriodTotals;
  monthly: FinancePeriodTotals;
  yearly: FinancePeriodTotals;
}

export interface FinanceBillSummary {
  activeCount: number;
  monthlyTotal: number;
  dueSoonCount: number;
}

export type FinanceFilter = 'all' | FinanceTransactionType;

export interface FinanceTransactionGroup {
  dateKey: string;
  items: FinanceTransaction[];
}
