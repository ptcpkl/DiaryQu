import {FRONTEND_DEMO_MODE} from '../../../config/appMode';
import {getSupabaseClient} from '../../../lib/supabase/client';
import {DEMO_FAMILY_ID, DEMO_USER_ID} from '../../../mocks/demoData';
import type {FinanceTransaction, FinanceTransactionDraft} from '../types';
import {localDateKey, offsetDateKey} from '../utils/finance';

type FinanceRow = {
  id: string;
  family_id: string;
  created_by: string;
  transaction_type: 'income' | 'expense';
  amount: number | string;
  category: string;
  note: string | null;
  occurred_on: string;
  created_at: string;
  updated_at: string;
};

function toTransaction(row: FinanceRow): FinanceTransaction {
  return {
    id: row.id,
    familyId: row.family_id,
    createdBy: row.created_by,
    type: row.transaction_type,
    amount: Number(row.amount),
    category: row.category,
    note: row.note,
    occurredOn: row.occurred_on,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function demoId() {
  return `demo-finance-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const nowIso = () => new Date().toISOString();

let demoTransactions: FinanceTransaction[] = [
  {
    id: 'demo-finance-1',
    familyId: DEMO_FAMILY_ID,
    createdBy: DEMO_USER_ID,
    type: 'income',
    amount: 5_500_000,
    category: 'Gaji',
    note: 'Pemasukan bulanan keluarga',
    occurredOn: localDateKey(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'demo-finance-2',
    familyId: DEMO_FAMILY_ID,
    createdBy: DEMO_USER_ID,
    type: 'expense',
    amount: 850_000,
    category: 'Belanja Bulanan',
    note: 'Belanja kebutuhan rumah',
    occurredOn: offsetDateKey(-1),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'demo-finance-3',
    familyId: DEMO_FAMILY_ID,
    createdBy: DEMO_USER_ID,
    type: 'expense',
    amount: 150_000,
    category: 'Sedekah',
    note: 'Sedekah Jumat',
    occurredOn: offsetDateKey(-2),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'demo-finance-4',
    familyId: DEMO_FAMILY_ID,
    createdBy: DEMO_USER_ID,
    type: 'income',
    amount: 1_250_000,
    category: 'Bisnis',
    note: 'Pendapatan usaha sampingan',
    occurredOn: offsetDateKey(-6),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: 'demo-finance-5',
    familyId: DEMO_FAMILY_ID,
    createdBy: DEMO_USER_ID,
    type: 'expense',
    amount: 320_000,
    category: 'Tagihan',
    note: 'Internet dan listrik',
    occurredOn: offsetDateKey(-8),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

export const financeService = {
  async listTransactions(familyId: string): Promise<FinanceTransaction[]> {
    if (FRONTEND_DEMO_MODE) {
      return demoTransactions
        .filter(item => item.familyId === familyId)
        .map(item => ({...item}));
    }

    const {data, error} = await getSupabaseClient()
      .from('financial_transactions')
      .select('*')
      .eq('family_id', familyId)
      .order('occurred_on', {ascending: false})
      .order('created_at', {ascending: false});
    if (error) throw error;
    return ((data ?? []) as FinanceRow[]).map(toTransaction);
  },

  async saveTransaction(
    familyId: string,
    transactionId: string | null,
    draft: FinanceTransactionDraft,
  ): Promise<string> {
    if (FRONTEND_DEMO_MODE) {
      const id = transactionId ?? demoId();
      const existing = demoTransactions.find(item => item.id === id);
      const next: FinanceTransaction = {
        id,
        familyId,
        createdBy: existing?.createdBy ?? DEMO_USER_ID,
        type: draft.type,
        amount: draft.amount,
        category: draft.category.trim(),
        note: draft.note?.trim() || null,
        occurredOn: draft.occurredOn,
        createdAt: existing?.createdAt ?? nowIso(),
        updatedAt: nowIso(),
      };
      demoTransactions = [
        ...demoTransactions.filter(item => item.id !== id),
        next,
      ];
      return id;
    }

    const client = getSupabaseClient();
    if (transactionId) {
      const {data, error} = await client
        .from('financial_transactions')
        .update({
          transaction_type: draft.type,
          amount: draft.amount,
          category: draft.category.trim(),
          note: draft.note?.trim() || null,
          occurred_on: draft.occurredOn,
        })
        .eq('id', transactionId)
        .eq('family_id', familyId)
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    }

    const {data: userData, error: userError} = await client.auth.getUser();
    if (userError) throw userError;
    const userId = userData.user?.id;
    if (!userId) throw new Error('AUTH_REQUIRED');

    const {data, error} = await client
      .from('financial_transactions')
      .insert({
        family_id: familyId,
        created_by: userId,
        transaction_type: draft.type,
        amount: draft.amount,
        category: draft.category.trim(),
        note: draft.note?.trim() || null,
        occurred_on: draft.occurredOn,
      })
      .select('id')
      .single();
    if (error) throw error;
    return data.id as string;
  },

  async removeTransaction(familyId: string, transactionId: string): Promise<void> {
    if (FRONTEND_DEMO_MODE) {
      demoTransactions = demoTransactions.filter(
        item => !(item.familyId === familyId && item.id === transactionId),
      );
      return;
    }

    const {error} = await getSupabaseClient()
      .from('financial_transactions')
      .delete()
      .eq('id', transactionId)
      .eq('family_id', familyId);
    if (error) throw error;
  },

  subscribe(familyId: string, onChange: () => void): () => void {
    if (FRONTEND_DEMO_MODE) return () => undefined;

    const client = getSupabaseClient();
    const channel = client
      .channel(`finance:${familyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financial_transactions',
          filter: `family_id=eq.${familyId}`,
        },
        () => onChange(),
      )
      .subscribe();

    return () => {
      client.removeChannel(channel).catch(() => undefined);
    };
  },
};
