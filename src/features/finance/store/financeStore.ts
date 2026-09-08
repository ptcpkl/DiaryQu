import {create} from 'zustand';

import {financeService} from '../services/financeService';
import type {FinanceTransaction, FinanceTransactionDraft} from '../types';

type FinanceState = {
  transactions: FinanceTransaction[];
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
  removeTransaction: (familyId: string, transactionId: string) => Promise<boolean>;
  subscribeFamily: (familyId: string) => () => void;
  clearError: () => void;
};

function financeError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const normalized = raw.toUpperCase();

  if (
    normalized.includes('FINANCIAL_TRANSACTIONS') ||
    normalized.includes('RELATION')
  ) {
    return 'Database UangQu belum siap. Jalankan migration Tahap 6 di Supabase terlebih dahulu.';
  }
  if (
    normalized.includes('HEAD_REQUIRED') ||
    normalized.includes('ROW-LEVEL SECURITY') ||
    normalized.includes('42501')
  ) {
    return 'Hanya Kepala Keluarga yang dapat mengubah transaksi keuangan.';
  }
  if (normalized.includes('AUTH_REQUIRED')) {
    return 'Sesi pengguna sudah tidak tersedia. Silakan masuk kembali.';
  }
  if (normalized.includes('INVALID_FINANCE')) {
    return 'Data transaksi belum valid. Periksa kembali nominal, kategori, dan tanggal.';
  }

  return 'Data keuangan belum dapat diproses. Silakan coba lagi.';
}

async function fetchTransactions(familyId: string) {
  return financeService.listTransactions(familyId);
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: [],
  isLoading: false,
  isSaving: false,
  error: null,
  currentFamilyId: null,

  load: async familyId => {
    set({isLoading: true, error: null, currentFamilyId: familyId});
    try {
      const transactions = await fetchTransactions(familyId);
      set({transactions, isLoading: false});
    } catch (error) {
      set({isLoading: false, error: financeError(error)});
    }
  },

  saveTransaction: async (familyId, transactionId, draft) => {
    set({isSaving: true, error: null});
    try {
      await financeService.saveTransaction(familyId, transactionId, draft);
      const transactions = await fetchTransactions(familyId);
      set({transactions, isSaving: false});
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
      const transactions = await fetchTransactions(familyId);
      set({transactions, isSaving: false});
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
