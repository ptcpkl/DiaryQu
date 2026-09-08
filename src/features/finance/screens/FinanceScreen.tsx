import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {
  AppButton,
  AppCard,
  AppText,
  Chip,
  FloatingActionButton,
  ScreenHeader,
  TextField,
} from '../../../components/ui';
import {
  colors,
  fontWeight,
  layout,
  radius,
  shadows,
  spacing,
  typography,
} from '../../../constants/theme';
import {useFamilyStore} from '../../family/store/familyStore';
import {useFinanceStore} from '../store/financeStore';
import type {
  FinanceFilter,
  FinanceTransaction,
  FinanceTransactionDraft,
  FinanceTransactionType,
} from '../types';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  calculateFinanceSummary,
  formatDateHeading,
  formatRupiah,
  groupTransactions,
  localDateKey,
  offsetDateKey,
  parseRupiahInput,
  validateFinanceDraft,
} from '../utils/finance';

type FinanceModule = 'uangqu' | 'assetqu';

type EditorState = {
  transaction: FinanceTransaction | null;
  type: FinanceTransactionType;
  amountText: string;
  category: string;
  note: string;
  occurredOn: string;
  error: string | null;
};

function editorState(transaction: FinanceTransaction | null): EditorState {
  return {
    transaction,
    type: transaction?.type ?? 'expense',
    amountText: transaction ? String(transaction.amount) : '',
    category: transaction?.category ?? '',
    note: transaction?.note ?? '',
    occurredOn: transaction?.occurredOn ?? localDateKey(),
    error: null,
  };
}

function StatCard({
  title,
  income,
  expense,
}: {
  title: string;
  income: number;
  expense: number;
}) {
  return (
    <AppCard padding="md" style={styles.statCard}>
      <AppText variant="label" tone="muted">
        {title}
      </AppText>
      <View style={styles.statRow}>
        <View style={styles.statMetric}>
          <AppText variant="micro" tone="muted">Pemasukan</AppText>
          <AppText variant="bodyStrong" tone="primary">+ {formatRupiah(income)}</AppText>
        </View>
        <View style={styles.statMetric}>
          <AppText variant="micro" tone="muted">Pengeluaran</AppText>
          <AppText variant="bodyStrong" tone="danger">- {formatRupiah(expense)}</AppText>
        </View>
      </View>
    </AppCard>
  );
}

function TransactionCard({
  transaction,
  canManage,
  onEdit,
  onDelete,
}: {
  transaction: FinanceTransaction;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const income = transaction.type === 'income';
  return (
    <AppCard padding="md" style={styles.transactionCard}>
      <View style={styles.transactionTop}>
        <View style={[styles.transactionIcon, income ? styles.incomeIcon : styles.expenseIcon]}>
          <AppText variant="section" tone={income ? 'primary' : 'danger'}>
            {income ? '↗' : '↘'}
          </AppText>
        </View>
        <View style={styles.transactionMain}>
          <AppText variant="bodyStrong">{transaction.category}</AppText>
          {transaction.note ? (
            <AppText variant="caption" tone="muted" numberOfLines={2}>
              {transaction.note}
            </AppText>
          ) : (
            <AppText variant="caption" tone="muted">Tanpa catatan</AppText>
          )}
        </View>
        <View style={styles.transactionAmountWrap}>
          <AppText
            variant="bodyStrong"
            tone={income ? 'primary' : 'danger'}
            align="right">
            {income ? '+' : '-'} {formatRupiah(transaction.amount)}
          </AppText>
          <AppText variant="micro" tone="muted" align="right">
            {income ? 'Pemasukan' : 'Pengeluaran'}
          </AppText>
        </View>
      </View>
      {canManage ? (
        <View style={styles.transactionActions}>
          <Pressable onPress={onEdit} hitSlop={8}>
            <AppText variant="label" tone="primary">Edit</AppText>
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={8}>
            <AppText variant="label" tone="danger">Hapus</AppText>
          </Pressable>
        </View>
      ) : null}
    </AppCard>
  );
}

function FinanceEditor({
  visible,
  initialTransaction,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean;
  initialTransaction: FinanceTransaction | null;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: FinanceTransactionDraft, id: string | null) => Promise<boolean>;
}) {
  const [state, setState] = useState(() => editorState(initialTransaction));

  useEffect(() => {
    if (visible) setState(editorState(initialTransaction));
  }, [visible, initialTransaction]);

  const categories = state.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const amount = parseRupiahInput(state.amountText);

  const submit = async () => {
    const draft: FinanceTransactionDraft = {
      type: state.type,
      amount,
      category: state.category,
      note: state.note.trim() || null,
      occurredOn: state.occurredOn,
    };
    const error = validateFinanceDraft(draft);
    if (error) {
      setState(current => ({...current, error}));
      return;
    }
    const ok = await onSave(draft, state.transaction?.id ?? null);
    if (ok) onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <AppText variant="heading">
                {state.transaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
              </AppText>
              <AppText variant="caption" tone="muted">Catat pemasukan atau pengeluaran keluarga.</AppText>
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
              <AppText variant="section">×</AppText>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.sheetContent}>
            <View style={styles.typeToggle}>
              <Pressable
                onPress={() => setState(current => ({...current, type: 'income', category: '', error: null}))}
                style={[styles.typeOption, state.type === 'income' && styles.typeOptionActive]}>
                <AppText variant="label" tone={state.type === 'income' ? 'primary' : 'muted'}>
                  Pemasukan
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => setState(current => ({...current, type: 'expense', category: '', error: null}))}
                style={[styles.typeOption, state.type === 'expense' && styles.typeOptionActive]}>
                <AppText variant="label" tone={state.type === 'expense' ? 'primary' : 'muted'}>
                  Pengeluaran
                </AppText>
              </Pressable>
            </View>

            <TextField
              label="Nominal"
              value={state.amountText ? formatRupiah(amount).replace('Rp ', '') : ''}
              onChangeText={value => setState(current => ({...current, amountText: String(parseRupiahInput(value) || ''), error: null}))}
              keyboardType="number-pad"
              placeholder="0"
              leftAdornment={<AppText variant="bodyStrong" tone="primary">Rp</AppText>}
            />

            <View>
              <AppText variant="label" tone="secondary" style={styles.fieldLabel}>Kategori</AppText>
              <View style={styles.categoryWrap}>
                {categories.map(category => (
                  <Chip
                    key={category}
                    label={category}
                    selected={state.category === category}
                    tone={state.category === category ? 'primary' : 'neutral'}
                    onPress={() => setState(current => ({...current, category, error: null}))}
                  />
                ))}
              </View>
            </View>

            <TextField
              label="Tanggal transaksi"
              value={state.occurredOn}
              onChangeText={occurredOn => setState(current => ({...current, occurredOn, error: null}))}
              placeholder="YYYY-MM-DD"
              autoCapitalize="none"
              helperText="Tanggal tidak boleh berada di masa depan."
            />
            <View style={styles.quickDateRow}>
              <Chip
                label="Hari ini"
                selected={state.occurredOn === localDateKey()}
                onPress={() => setState(current => ({...current, occurredOn: localDateKey(), error: null}))}
              />
              <Chip
                label="Kemarin"
                selected={state.occurredOn === offsetDateKey(-1)}
                onPress={() => setState(current => ({...current, occurredOn: offsetDateKey(-1), error: null}))}
              />
            </View>

            <TextField
              label="Catatan"
              value={state.note}
              onChangeText={note => setState(current => ({...current, note, error: null}))}
              placeholder="Opsional, misalnya belanja kebutuhan dapur"
              multiline
              maxLength={500}
              inputStyle={styles.noteInput}
            />

            {state.error ? (
              <AppCard padding="sm" style={styles.editorError}>
                <AppText variant="caption" tone="danger">{state.error}</AppText>
              </AppCard>
            ) : null}

            <AppButton
              label={state.transaction ? 'Simpan Perubahan' : 'Simpan Transaksi'}
              onPress={submit}
              loading={saving}
              size="lg"
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function FinanceScreen() {
  const family = useFamilyStore(state => state.family);
  const transactions = useFinanceStore(state => state.transactions);
  const isLoading = useFinanceStore(state => state.isLoading);
  const isSaving = useFinanceStore(state => state.isSaving);
  const error = useFinanceStore(state => state.error);
  const load = useFinanceStore(state => state.load);
  const saveTransaction = useFinanceStore(state => state.saveTransaction);
  const removeTransaction = useFinanceStore(state => state.removeTransaction);
  const subscribeFamily = useFinanceStore(state => state.subscribeFamily);
  const clearError = useFinanceStore(state => state.clearError);

  const [module, setModule] = useState<FinanceModule>('uangqu');
  const [filter, setFilter] = useState<FinanceFilter>('all');
  const [editorVisible, setEditorVisible] = useState(false);
  const [editing, setEditing] = useState<FinanceTransaction | null>(null);

  const familyId = family?.id ?? null;
  const canManage = family?.role === 'head';

  useEffect(() => {
    if (!familyId) return;
    load(familyId).catch(() => undefined);
    const unsubscribe = subscribeFamily(familyId);
    return unsubscribe;
  }, [familyId, load, subscribeFamily]);

  const summary = useMemo(() => calculateFinanceSummary(transactions), [transactions]);
  const filtered = useMemo(
    () => transactions.filter(item => filter === 'all' || item.type === filter),
    [filter, transactions],
  );
  const groups = useMemo(() => groupTransactions(filtered), [filtered]);

  const openCreate = () => {
    setEditing(null);
    setEditorVisible(true);
  };

  const openEdit = (transaction: FinanceTransaction) => {
    setEditing(transaction);
    setEditorVisible(true);
  };

  const confirmDelete = (transaction: FinanceTransaction) => {
    if (!familyId) return;
    Alert.alert(
      'Hapus transaksi?',
      `${transaction.category} • ${formatRupiah(transaction.amount)} akan dihapus dari riwayat.`,
      [
        {text: 'Batal', style: 'cancel'},
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => removeTransaction(familyId, transaction.id).catch(() => undefined),
        },
      ],
    );
  };

  const handleSave = async (draft: FinanceTransactionDraft, id: string | null) => {
    if (!familyId) return false;
    return saveTransaction(familyId, id, draft);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Keuangan"
          subtitle={family?.name ?? 'UangQu keluarga'}
          variant="primary"
          right={
            <View style={styles.headerIcon}>
              <AppText variant="title" tone="onPrimary">Rp</AppText>
            </View>
          }
        />

        <AppCard padding="lg" style={styles.sedekahBanner}>
          <View style={styles.sedekahIcon}>
            <AppText variant="heading" tone="primary">♡</AppText>
          </View>
          <View style={styles.sedekahText}>
            <AppText variant="section">Sisihkan untuk kebaikan</AppText>
            <AppText variant="bodySmall" tone="muted">
              Catat sedekah bersama pengeluaran agar rencana keuangan keluarga tetap transparan.
            </AppText>
          </View>
        </AppCard>

        <View style={styles.moduleToggle}>
          <Pressable
            onPress={() => setModule('uangqu')}
            style={[styles.moduleTab, module === 'uangqu' && styles.moduleTabActive]}>
            <AppText variant="label" tone={module === 'uangqu' ? 'primary' : 'muted'}>UangQu</AppText>
          </Pressable>
          <Pressable
            onPress={() => setModule('assetqu')}
            style={[styles.moduleTab, module === 'assetqu' && styles.moduleTabActive]}>
            <AppText variant="label" tone={module === 'assetqu' ? 'primary' : 'muted'}>AssetQu</AppText>
          </Pressable>
        </View>

        {module === 'assetqu' ? (
          <AppCard padding="lg" elevated style={styles.assetPlaceholder}>
            <View style={styles.assetPlaceholderIcon}>
              <AppText variant="title" tone="primary">◇</AppText>
            </View>
            <AppText variant="heading" align="center">AssetQu</AppText>
            <AppText variant="bodySmall" tone="muted" align="center">
              Modul aset disiapkan sebagai domain terpisah agar transaksi keuangan tidak tercampur dengan catatan harta. Implementasi penuh ada di tahap berikutnya.
            </AppText>
            <AppButton label="Kembali ke UangQu" variant="secondary" onPress={() => setModule('uangqu')} />
          </AppCard>
        ) : (
          <>
            <AppCard padding="xl" style={styles.balanceCard}>
              <View style={styles.balanceTop}>
                <View>
                  <AppText variant="label" tone="muted">Total Saldo Kumulatif</AppText>
                  <AppText
                    variant="display"
                    tone={summary.balance >= 0 ? 'primary' : 'danger'}
                    style={styles.balanceValue}>
                    {summary.balance < 0 ? '- ' : ''}{formatRupiah(summary.balance)}
                  </AppText>
                </View>
                <View style={styles.balanceBadge}>
                  <AppText variant="micro" tone="primary">SEPANJANG WAKTU</AppText>
                </View>
              </View>
              <View style={styles.balanceBreakdown}>
                <AppText variant="caption" tone="muted">
                  Pemasukan {formatRupiah(summary.allTime.income)}
                </AppText>
                <AppText variant="caption" tone="muted">
                  Pengeluaran {formatRupiah(summary.allTime.expense)}
                </AppText>
              </View>
            </AppCard>

            <View style={styles.statsGrid}>
              <StatCard
                title="Bulan Ini"
                income={summary.monthly.income}
                expense={summary.monthly.expense}
              />
              <StatCard
                title="Tahun Ini"
                income={summary.yearly.income}
                expense={summary.yearly.expense}
              />
            </View>

            {!canManage ? (
              <AppCard padding="md" style={styles.readOnlyCard}>
                <AppText variant="bodyStrong">Mode transparansi keluarga</AppText>
                <AppText variant="caption" tone="muted">
                  Anggota dapat melihat catatan UangQu. Penambahan dan perubahan transaksi dikelola Kepala Keluarga.
                </AppText>
              </AppCard>
            ) : null}

            <View style={styles.historyHeader}>
              <View>
                <AppText variant="section">Riwayat Transaksi</AppText>
                <AppText variant="caption" tone="muted">{filtered.length} transaksi tercatat</AppText>
              </View>
              {canManage ? (
                <Pressable onPress={openCreate} hitSlop={8}>
                  <AppText variant="label" tone="primary">+ Tambah</AppText>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.filterRow}>
              <Chip label="Semua" selected={filter === 'all'} onPress={() => setFilter('all')} />
              <Chip label="Pemasukan" selected={filter === 'income'} tone="success" onPress={() => setFilter('income')} />
              <Chip label="Pengeluaran" selected={filter === 'expense'} tone="danger" onPress={() => setFilter('expense')} />
            </View>

            {error ? (
              <AppCard padding="md" style={styles.errorCard}>
                <AppText variant="bodyStrong" tone="danger">Data UangQu belum tersedia</AppText>
                <AppText variant="caption" tone="muted">{error}</AppText>
                <View style={styles.errorActions}>
                  <AppButton label="Tutup" variant="ghost" size="sm" fullWidth={false} onPress={clearError} />
                  {familyId ? (
                    <AppButton label="Coba lagi" variant="secondary" size="sm" fullWidth={false} onPress={() => load(familyId)} />
                  ) : null}
                </View>
              </AppCard>
            ) : null}

            {isLoading && transactions.length === 0 ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={colors.primary} />
                <AppText variant="caption" tone="muted">Memuat riwayat UangQu...</AppText>
              </View>
            ) : groups.length === 0 ? (
              <AppCard padding="xl" elevated style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <AppText variant="title" tone="primary">Rp</AppText>
                </View>
                <AppText variant="section" align="center">Belum ada transaksi</AppText>
                <AppText variant="bodySmall" tone="muted" align="center">
                  {filter === 'all'
                    ? 'Catat pemasukan dan pengeluaran agar saldo serta statistik tersusun otomatis.'
                    : 'Belum ada transaksi untuk filter yang dipilih.'}
                </AppText>
                {canManage && filter === 'all' ? (
                  <AppButton label="Tambah transaksi pertama" variant="secondary" onPress={openCreate} />
                ) : null}
              </AppCard>
            ) : (
              groups.map(group => (
                <View key={group.dateKey} style={styles.historyGroup}>
                  <AppText variant="label" tone="secondary">{formatDateHeading(group.dateKey)}</AppText>
                  <View style={styles.historyList}>
                    {group.items.map(transaction => (
                      <TransactionCard
                        key={transaction.id}
                        transaction={transaction}
                        canManage={canManage}
                        onEdit={() => openEdit(transaction)}
                        onDelete={() => confirmDelete(transaction)}
                      />
                    ))}
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {module === 'uangqu' && canManage ? (
        <FloatingActionButton
          accessibilityLabel="Tambah transaksi UangQu"
          onPress={openCreate}
          label="Transaksi"
          extended
          style={styles.fab}
        />
      ) : null}

      <FinanceEditor
        visible={editorVisible}
        initialTransaction={editing}
        saving={isSaving}
        onClose={() => setEditorVisible(false)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  content: {
    padding: layout.screenPadding,
    paddingBottom: 130,
    gap: spacing.xl,
  },
  headerIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sedekahBanner: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryMuted,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sedekahIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sedekahText: {flex: 1, gap: spacing.xs},
  moduleToggle: {
    minHeight: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.blueSoft,
    padding: spacing.xs,
    flexDirection: 'row',
  },
  moduleTab: {
    flex: 1,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTabActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  assetPlaceholder: {alignItems: 'center', gap: spacing.md, minHeight: 330, justifyContent: 'center'},
  assetPlaceholderIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    borderWidth: 1.2,
    borderColor: colors.primaryMuted,
    backgroundColor: colors.backgroundElevated,
  },
  balanceTop: {flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md},
  balanceValue: {marginTop: spacing.sm, letterSpacing: -0.8},
  balanceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  balanceBreakdown: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statsGrid: {gap: spacing.md},
  statCard: {gap: spacing.md},
  statRow: {flexDirection: 'row', gap: spacing.md},
  statMetric: {flex: 1, gap: spacing.xs},
  readOnlyCard: {backgroundColor: colors.infoSoft, gap: spacing.xs, borderColor: colors.blueSoft, borderWidth: 1},
  historyHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  filterRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  errorCard: {backgroundColor: colors.dangerSoft, gap: spacing.sm},
  errorActions: {flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm},
  loadingWrap: {alignItems: 'center', paddingVertical: spacing.xxxl, gap: spacing.md},
  emptyCard: {alignItems: 'center', gap: spacing.md},
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyGroup: {gap: spacing.sm},
  historyList: {gap: spacing.sm},
  transactionCard: {gap: spacing.md},
  transactionTop: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  transactionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomeIcon: {backgroundColor: colors.successSoft},
  expenseIcon: {backgroundColor: colors.dangerSoft},
  transactionMain: {flex: 1, gap: spacing.xxs, minWidth: 0},
  transactionAmountWrap: {maxWidth: '42%', gap: spacing.xxs},
  transactionActions: {
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'flex-end',
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  fab: {position: 'absolute', right: spacing.xl, bottom: spacing.xl},
  modalRoot: {flex: 1, justifyContent: 'flex-end'},
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    maxHeight: '91%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
    ...shadows.lg,
  },
  sheetHandle: {
    width: 46,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
  },
  sheetHeader: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetContent: {padding: spacing.xl, paddingTop: 0, paddingBottom: 40, gap: spacing.xl},
  typeToggle: {
    minHeight: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.xs,
    flexDirection: 'row',
  },
  typeOption: {flex: 1, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center'},
  typeOptionActive: {backgroundColor: colors.surface, ...shadows.sm},
  fieldLabel: {marginBottom: spacing.sm, marginLeft: spacing.xs},
  categoryWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  quickDateRow: {flexDirection: 'row', gap: spacing.sm},
  noteInput: {minHeight: 72, paddingVertical: spacing.md, textAlignVertical: 'top'},
  editorError: {backgroundColor: colors.dangerSoft},
});
