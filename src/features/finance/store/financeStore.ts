import {create} from 'zustand';

import {financeService} from '../services/financeService';
import type {
  FinanceBill,
  FinanceBillDraft,
  FinanceTransaction,
  FinanceTransactionDraft,
} from '../types';

type FinanceState = {
  transactions: FinanceTransaction[];
  bills: FinanceBill[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  currentFamilyId: string | null;
  load: (familyId: string) => Promise<void>;
  saveTransaction: (
    familyId: string,
    transactionId: string | null,
    draft: FinanceTransactionDraft,
  ) => Promise<boolean>;
  saveBill: (
    familyId: string,
    billId: string | null,
    draft: FinanceBillDraft,
  ) => Promise<boolean>;
  removeTransaction: (familyId: string, transactionId: string) => Promise<boolean>;
  removeBill: (familyId: string, billId: string) => Promise<boolean>;
  subscribeFamily: (familyId: string) => () => void;
  clearError: () => void;
};

function financeError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const normalized = raw.toUpperCase();

  if (
    normalized.includes('FINANCIAL_TRANSACTIONS') ||
    normalized.includes('FINANCIAL_BILLS') ||
    normalized.includes('RELATION')
  ) {
    return 'Database Keuangan belum siap. Jalankan migration UangQu dan List Tagihan di Supabase terlebih dahulu.';
  }
  if (
    normalized.includes('HEAD_REQUIRED') ||
    normalized.includes('ROW-LEVEL SECURITY') ||
    normalized.includes('42501')
  ) {
    return 'Hanya Kepala Keluarga yang dapat mengubah data keuangan.';
  }
  if (normalized.includes('AUTH_REQUIRED')) {
    return 'Sesi pengguna sudah tidak tersedia. Silakan masuk kembali.';
  }
  if (normalized.includes('INVALID_FINANCE')) {
    return 'Data keuangan belum valid. Periksa kembali nominal, kategori, dan tanggal.';
  }

  return 'Data keuangan belum dapat diproses. Silakan coba lagi.';
}

async function fetchFinance(familyId: string) {
  const [transactions, bills] = await Promise.all([
    financeService.listTransactions(familyId),
    financeService.listBills(familyId),
  ]);
  return {transactions, bills};
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: [],
  bills: [],
  isLoading: false,
  isSaving: false,
  error: null,
  currentFamilyId: null,

  load: async familyId => {
    set({isLoading: true, error: null, currentFamilyId: familyId});
    try {
      const data = await fetchFinance(familyId);
      set({...data, isLoading: false});
    } catch (error) {
      set({isLoading: false, error: financeError(error)});
    }
  },

  saveTransaction: async (familyId, transactionId, draft) => {
    set({isSaving: true, error: null});
    try {
      await financeService.saveTransaction(familyId, transactionId, draft);
      const data = await fetchFinance(familyId);
      set({...data, isSaving: false});
      return true;
    } catch (error) {
      set({isSaving: false, error: financeError(error)});
      return false;
    }
  },

  saveBill: async (familyId, billId, draft) => {
    set({isSaving: true, error: null});
    try {
      await financeService.saveBill(familyId, billId, draft);
      const data = await fetchFinance(familyId);
      set({...data, isSaving: false});
      return true;
    } catch (error) {
      set({isSaving: false, error: financeError(error)});
      return false;
    }
  },

  removeTransaction: async (familyId, transactionId) => {
    set({isSaving: true, error: null});
    try {
      await financeService.removeTransaction(familyId, transactionId);
      const data = await fetchFinance(familyId);
      set({...data, isSaving: false});
      return true;
    } catch (error) {
      set({isSaving: false, error: financeError(error)});
      return false;
    }
  },

  removeBill: async (familyId, billId) => {
    set({isSaving: true, error: null});
    try {
      await financeService.removeBill(familyId, billId);
      const data = await fetchFinance(familyId);
      set({...data, isSaving: false});
      return true;
    } catch (error) {
      set({isSaving: false, error: financeError(error)});
      return false;
    }
  },

  subscribeFamily: familyId =>
    financeService.subscribe(familyId, () => {
      get().load(familyId).catch(() => undefined);
    }),

  clearError: () => set({error: null}),
}));
