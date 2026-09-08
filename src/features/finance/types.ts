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

export type FinanceFilter = 'all' | FinanceTransactionType;

export interface FinanceTransactionGroup {
  dateKey: string;
  items: FinanceTransaction[];
}
