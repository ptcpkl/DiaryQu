import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
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

import type {MainTabParamList} from '../../../app/navigation/types';
import {
  AppButton,
  AppCard,
  AppText,
  Chip,
  FloatingActionButton,
  ScreenHeader,
  TextField,
} from '../../../components/ui';
import {colors, layout, radius, spacing} from '../../../constants/theme';
import {AssetQuPanel} from '../../assets/screens/AssetQuPanel';
import {useFamilyStore} from '../../family/store/familyStore';
import {useFinanceStore} from '../store/financeStore';
import type {
  FinanceBill,
  FinanceBillDraft,
  FinanceFilter,
  FinanceTransaction,
  FinanceTransactionDraft,
  FinanceTransactionType,
} from '../types';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  calculateBillSummary,
  calculateFinanceSummary,
  formatBillDueDay,
  formatDateHeading,
  formatRupiah,
  groupTransactions,
  localDateKey,
  offsetDateKey,
  parseRupiahInput,
  validateFinanceBillDraft,
  validateFinanceDraft,
} from '../utils/finance';

type Props = BottomTabScreenProps<MainTabParamList, 'Finance'>;
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

type BillEditorState = {
  bill: FinanceBill | null;
  title: string;
  amountText: string;
  dueDayText: string;
  note: string;
  isActive: boolean;
  error: string | null;
};

function transactionEditorState(transaction: FinanceTransaction | null): EditorState {
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

function billEditorState(bill: FinanceBill | null): BillEditorState {
  return {
    bill,
    title: bill?.title ?? '',
    amountText: bill ? String(bill.amount) : '',
    dueDayText: bill ? String(bill.dueDay) : '',
    note: bill?.note ?? '',
    isActive: bill?.isActive ?? true,
    error: null,
  };
}

function OverviewMetric({
  title,
  value,
  helper,
  tone = 'primary',
}: {
  title: string;
  value: string;
  helper: string;
  tone?: 'primary' | 'danger' | 'default';
}) {
  return (
    <AppCard padding="md" style={styles.overviewCard}>
      <AppText variant="micro" tone="muted">{title}</AppText>
      <AppText
        variant="bodyStrong"
        tone={tone === 'default' ? 'secondary' : tone}
        numberOfLines={1}>
        {value}
      </AppText>
      <AppText variant="micro" tone="muted" numberOfLines={2}>{helper}</AppText>
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
          <AppText variant="section" tone={income ? 'primary' : 'danger'}>{income ? '↗' : '↘'}</AppText>
        </View>
        <View style={styles.flexOne}>
          <AppText variant="bodyStrong">{transaction.category}</AppText>
          <AppText variant="caption" tone="muted" numberOfLines={2}>
            {transaction.note || 'Tanpa catatan'}
          </AppText>
        </View>
        <View style={styles.amountColumn}>
          <AppText variant="bodyStrong" tone={income ? 'primary' : 'danger'} align="right">
            {income ? '+' : '-'} {formatRupiah(transaction.amount)}
          </AppText>
          <AppText variant="micro" tone="muted" align="right">{income ? 'Pemasukan' : 'Pengeluaran'}</AppText>
        </View>
      </View>
      {canManage ? (
        <View style={styles.actionsRow}>
          <Pressable onPress={onEdit} hitSlop={8}><AppText variant="label" tone="primary">Edit</AppText></Pressable>
          <Pressable onPress={onDelete} hitSlop={8}><AppText variant="label" tone="danger">Hapus</AppText></Pressable>
        </View>
      ) : null}
    </AppCard>
  );
}

function BillCard({
  bill,
  canManage,
  onEdit,
  onDelete,
}: {
  bill: FinanceBill;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <AppCard padding="md" style={[styles.billCard, !bill.isActive ? styles.inactiveCard : undefined]}>
      <View style={styles.billTop}>
        <View style={styles.billIcon}><AppText variant="section" tone="primary">▤</AppText></View>
        <View style={styles.flexOne}>
          <View style={styles.billTitleRow}>
            <AppText variant="bodyStrong" numberOfLines={1} style={styles.flexOne}>{bill.title}</AppText>
            {!bill.isActive ? <Chip label="Arsip" /> : null}
          </View>
          <AppText variant="caption" tone="muted">
            Jatuh tempo {formatBillDueDay(bill.dueDay)}
          </AppText>
          {bill.note ? <AppText variant="caption" tone="muted" numberOfLines={1}>{bill.note}</AppText> : null}
        </View>
        <AppText variant="bodyStrong" tone="primary" align="right">{formatRupiah(bill.amount)}</AppText>
      </View>
      {canManage ? (
        <View style={styles.actionsRow}>
          <Pressable onPress={onEdit} hitSlop={8}><AppText variant="label" tone="primary">Edit</AppText></Pressable>
          <Pressable onPress={onDelete} hitSlop={8}><AppText variant="label" tone="danger">Hapus</AppText></Pressable>
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
  const [state, setState] = useState(() => transactionEditorState(initialTransaction));

  useEffect(() => {
    if (visible) setState(transactionEditorState(initialTransaction));
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
    const validation = validateFinanceDraft(draft);
    if (validation) {
      setState(current => ({...current, error: validation}));
      return;
    }
    const ok = await onSave(draft, state.transaction?.id ?? null);
    if (ok) onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={styles.flexOne}>
              <AppText variant="heading">{state.transaction ? 'Edit Transaksi' : 'Tambah Transaksi'}</AppText>
              <AppText variant="caption" tone="muted">Catat pemasukan atau pengeluaran keluarga.</AppText>
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}><AppText variant="section">×</AppText></Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetContent}>
            <View style={styles.typeToggle}>
              <Pressable
                onPress={() => setState(current => ({...current, type: 'income', category: '', error: null}))}
                style={[styles.typeOption, state.type === 'income' && styles.typeOptionActive]}>
                <AppText variant="label" tone={state.type === 'income' ? 'primary' : 'muted'}>Pemasukan</AppText>
              </Pressable>
              <Pressable
                onPress={() => setState(current => ({...current, type: 'expense', category: '', error: null}))}
                style={[styles.typeOption, state.type === 'expense' && styles.typeOptionActive]}>
                <AppText variant="label" tone={state.type === 'expense' ? 'primary' : 'muted'}>Pengeluaran</AppText>
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
              <View style={styles.chipWrap}>
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
              <Chip label="Hari ini" selected={state.occurredOn === localDateKey()} onPress={() => setState(current => ({...current, occurredOn: localDateKey(), error: null}))} />
              <Chip label="Kemarin" selected={state.occurredOn === offsetDateKey(-1)} onPress={() => setState(current => ({...current, occurredOn: offsetDateKey(-1), error: null}))} />
            </View>

            <TextField
              label="Catatan"
              value={state.note}
              onChangeText={note => setState(current => ({...current, note, error: null}))}
              placeholder="Opsional"
              multiline
              maxLength={500}
              inputStyle={styles.noteInput}
            />

            {state.error ? <AppCard padding="sm" style={styles.errorCard}><AppText variant="caption" tone="danger">{state.error}</AppText></AppCard> : null}
            <AppButton label={state.transaction ? 'Simpan Perubahan' : 'Simpan Transaksi'} onPress={submit} loading={saving} size="lg" />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function BillEditor({
  visible,
  initialBill,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean;
  initialBill: FinanceBill | null;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: FinanceBillDraft, id: string | null) => Promise<boolean>;
}) {
  const [state, setState] = useState(() => billEditorState(initialBill));

  useEffect(() => {
    if (visible) setState(billEditorState(initialBill));
  }, [visible, initialBill]);

  const amount = parseRupiahInput(state.amountText);
  const dueDay = Number(state.dueDayText);

  const submit = async () => {
    const draft: FinanceBillDraft = {
      title: state.title.trim(),
      amount,
      dueDay,
      note: state.note.trim() || null,
      isActive: state.isActive,
    };
    const validation = validateFinanceBillDraft(draft);
    if (validation) {
      setState(current => ({...current, error: validation}));
      return;
    }
    const ok = await onSave(draft, state.bill?.id ?? null);
    if (ok) onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={styles.flexOne}>
              <AppText variant="heading">{state.bill ? 'Edit Tagihan' : 'Tambah Tagihan'}</AppText>
              <AppText variant="caption" tone="muted">List Tagihan menggantikan kolom Budget.</AppText>
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}><AppText variant="section">×</AppText></Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetContent}>
            <TextField
              label="Nama tagihan"
              value={state.title}
              onChangeText={title => setState(current => ({...current, title, error: null}))}
              placeholder="Contoh: Listrik Rumah"
              maxLength={120}
            />
            <TextField
              label="Nominal bulanan"
              value={state.amountText ? formatRupiah(amount).replace('Rp ', '') : ''}
              onChangeText={value => setState(current => ({...current, amountText: String(parseRupiahInput(value) || ''), error: null}))}
              keyboardType="number-pad"
              placeholder="0"
              leftAdornment={<AppText variant="bodyStrong" tone="primary">Rp</AppText>}
            />
            <TextField
              label="Tanggal jatuh tempo"
              value={state.dueDayText}
              onChangeText={dueDayText => setState(current => ({...current, dueDayText: dueDayText.replace(/\D/g, '').slice(0, 2), error: null}))}
              keyboardType="number-pad"
              placeholder="1 - 31"
              helperText="Tagihan berulang setiap bulan pada tanggal ini."
            />
            <TextField
              label="Catatan"
              value={state.note}
              onChangeText={note => setState(current => ({...current, note, error: null}))}
              placeholder="Opsional"
              multiline
              maxLength={500}
              inputStyle={styles.noteInput}
            />
            <View>
              <AppText variant="label" tone="secondary" style={styles.fieldLabel}>Status</AppText>
              <View style={styles.quickDateRow}>
                <Chip label="Aktif" selected={state.isActive} tone="success" onPress={() => setState(current => ({...current, isActive: true, error: null}))} />
                <Chip label="Diarsipkan" selected={!state.isActive} onPress={() => setState(current => ({...current, isActive: false, error: null}))} />
              </View>
            </View>
            {state.error ? <AppCard padding="sm" style={styles.errorCard}><AppText variant="caption" tone="danger">{state.error}</AppText></AppCard> : null}
            <AppButton label={state.bill ? 'Simpan Perubahan' : 'Simpan Tagihan'} onPress={submit} loading={saving} size="lg" />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function FinanceScreen({route}: Props) {
  const family = useFamilyStore(state => state.family);
  const transactions = useFinanceStore(state => state.transactions);
  const bills = useFinanceStore(state => state.bills);
  const isLoading = useFinanceStore(state => state.isLoading);
  const isSaving = useFinanceStore(state => state.isSaving);
  const error = useFinanceStore(state => state.error);
  const load = useFinanceStore(state => state.load);
  const saveTransaction = useFinanceStore(state => state.saveTransaction);
  const saveBill = useFinanceStore(state => state.saveBill);
  const removeTransaction = useFinanceStore(state => state.removeTransaction);
  const removeBill = useFinanceStore(state => state.removeBill);
  const subscribeFamily = useFinanceStore(state => state.subscribeFamily);
  const clearError = useFinanceStore(state => state.clearError);

  const [module, setModule] = useState<FinanceModule>(route.params?.module ?? 'uangqu');
  const [filter, setFilter] = useState<FinanceFilter>('all');
  const [transactionEditorVisible, setTransactionEditorVisible] = useState(false);
  const [billEditorVisible, setBillEditorVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);
  const [editingBill, setEditingBill] = useState<FinanceBill | null>(null);

  const familyId = family?.id ?? null;
  const canManage = family?.role === 'head';

  useEffect(() => {
    if (route.params?.module) setModule(route.params.module);
  }, [route.params?.module]);

  useEffect(() => {
    if (!familyId) return;
    load(familyId).catch(() => undefined);
    const unsubscribe = subscribeFamily(familyId);
    return unsubscribe;
  }, [familyId, load, subscribeFamily]);

  const summary = useMemo(() => calculateFinanceSummary(transactions), [transactions]);
  const billSummary = useMemo(() => calculateBillSummary(bills), [bills]);
  const filtered = useMemo(() => transactions.filter(item => filter === 'all' || item.type === filter), [filter, transactions]);
  const groups = useMemo(() => groupTransactions(filtered), [filtered]);
  const sortedBills = useMemo(() => [...bills].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return a.dueDay - b.dueDay;
  }), [bills]);

  const openTransactionCreate = () => {
    setEditingTransaction(null);
    setTransactionEditorVisible(true);
  };
  const openBillCreate = () => {
    setEditingBill(null);
    setBillEditorVisible(true);
  };

  const confirmDeleteTransaction = (transaction: FinanceTransaction) => {
    if (!familyId) return;
    Alert.alert('Hapus transaksi?', `${transaction.category} • ${formatRupiah(transaction.amount)} akan dihapus dari riwayat.`, [
      {text: 'Batal', style: 'cancel'},
      {text: 'Hapus', style: 'destructive', onPress: () => removeTransaction(familyId, transaction.id).catch(() => undefined)},
    ]);
  };

  const confirmDeleteBill = (bill: FinanceBill) => {
    if (!familyId) return;
    Alert.alert('Hapus tagihan?', `${bill.title} akan dihapus dari List Tagihan.`, [
      {text: 'Batal', style: 'cancel'},
      {text: 'Hapus', style: 'destructive', onPress: () => removeBill(familyId, bill.id).catch(() => undefined)},
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Keuangan"
          subtitle={family?.name ?? 'Keuangan keluarga'}
          variant="primary"
          right={<View style={styles.headerIcon}><AppText variant="title" tone="onPrimary">Rp</AppText></View>}
        />

        <AppCard padding="lg" style={styles.sedekahBanner}>
          <View style={styles.sedekahIcon}><AppText variant="heading" tone="primary">♡</AppText></View>
          <View style={styles.flexOne}>
            <AppText variant="section">Sisihkan untuk kebaikan</AppText>
            <AppText variant="bodySmall" tone="muted">Catat sedekah bersama pengeluaran agar keuangan keluarga tetap transparan.</AppText>
          </View>
        </AppCard>

        <View style={styles.moduleToggle}>
          <Pressable onPress={() => setModule('uangqu')} style={[styles.moduleTab, module === 'uangqu' && styles.moduleTabActive]}>
            <AppText variant="label" tone={module === 'uangqu' ? 'primary' : 'muted'}>UangQu</AppText>
          </Pressable>
          <Pressable onPress={() => setModule('assetqu')} style={[styles.moduleTab, module === 'assetqu' && styles.moduleTabActive]}>
            <AppText variant="label" tone={module === 'assetqu' ? 'primary' : 'muted'}>AssetQu</AppText>
          </Pressable>
        </View>

        {module === 'assetqu' ? (
          <AssetQuPanel familyId={familyId} canManage={canManage} />
        ) : (
          <>
            <AppCard padding="lg" style={styles.balanceCard}>
              <AppText variant="label" tone="muted">Total Saldo Kumulatif</AppText>
              <AppText variant="display" tone={summary.balance >= 0 ? 'primary' : 'danger'} style={styles.balanceValue}>
                {summary.balance < 0 ? '- ' : ''}{formatRupiah(summary.balance)}
              </AppText>
              <AppText variant="caption" tone="muted">Saldo sepanjang waktu, bukan saldo yang di-reset setiap bulan.</AppText>
            </AppCard>

            <View style={styles.overviewGrid}>
              <OverviewMetric
                title="PEMASUKAN"
                value={formatRupiah(summary.monthly.income)}
                helper="Bulan ini"
                tone="primary"
              />
              <OverviewMetric
                title="PENGELUARAN"
                value={formatRupiah(summary.monthly.expense)}
                helper="Bulan ini"
                tone="danger"
              />
              <OverviewMetric
                title="LIST TAGIHAN"
                value={`${billSummary.activeCount} tagihan`}
                helper={`${formatRupiah(billSummary.monthlyTotal)} / bulan`}
                tone="default"
              />
            </View>

            <AppCard padding="md" style={styles.yearCard}>
              <View style={styles.yearMetric}>
                <AppText variant="micro" tone="muted">TAHUN INI • PEMASUKAN</AppText>
                <AppText variant="bodyStrong" tone="primary">+ {formatRupiah(summary.yearly.income)}</AppText>
              </View>
              <View style={styles.yearDivider} />
              <View style={styles.yearMetric}>
                <AppText variant="micro" tone="muted">TAHUN INI • PENGELUARAN</AppText>
                <AppText variant="bodyStrong" tone="danger">- {formatRupiah(summary.yearly.expense)}</AppText>
              </View>
            </AppCard>

            <View style={styles.sectionHeader}>
              <View>
                <AppText variant="section">List Tagihan</AppText>
                <AppText variant="caption" tone="muted">
                  {billSummary.dueSoonCount > 0
                    ? `${billSummary.dueSoonCount} tagihan jatuh tempo dalam 7 hari ke depan`
                    : 'Daftar tagihan bulanan keluarga'}
                </AppText>
              </View>
              {canManage ? <Pressable onPress={openBillCreate} hitSlop={8}><AppText variant="label" tone="primary">+ Tagihan</AppText></Pressable> : null}
            </View>

            {sortedBills.length === 0 ? (
              <AppCard padding="lg" style={styles.emptyCompact}>
                <AppText variant="bodyStrong">Belum ada List Tagihan</AppText>
                <AppText variant="caption" tone="muted">Tambahkan listrik, internet, air, cicilan, atau tagihan rutin lainnya.</AppText>
                {canManage ? <AppButton label="Tambah tagihan" variant="secondary" size="sm" onPress={openBillCreate} /> : null}
              </AppCard>
            ) : (
              <View style={styles.billList}>
                {sortedBills.map(bill => (
                  <BillCard
                    key={bill.id}
                    bill={bill}
                    canManage={canManage}
                    onEdit={() => {setEditingBill(bill); setBillEditorVisible(true);}}
                    onDelete={() => confirmDeleteBill(bill)}
                  />
                ))}
              </View>
            )}

            {!canManage ? (
              <AppCard padding="md" style={styles.readOnlyCard}>
                <AppText variant="bodyStrong">Mode transparansi keluarga</AppText>
                <AppText variant="caption" tone="muted">Anggota dapat melihat UangQu dan List Tagihan. Perubahan dikelola Kepala Keluarga.</AppText>
              </AppCard>
            ) : null}

            <View style={styles.sectionHeader}>
              <View>
                <AppText variant="section">Riwayat Transaksi</AppText>
                <AppText variant="caption" tone="muted">{filtered.length} transaksi tercatat</AppText>
              </View>
              {canManage ? <Pressable onPress={openTransactionCreate} hitSlop={8}><AppText variant="label" tone="primary">+ Tambah</AppText></Pressable> : null}
            </View>

            <View style={styles.filterRow}>
              <Chip label="Semua" selected={filter === 'all'} onPress={() => setFilter('all')} />
              <Chip label="Pemasukan" selected={filter === 'income'} tone="success" onPress={() => setFilter('income')} />
              <Chip label="Pengeluaran" selected={filter === 'expense'} tone="danger" onPress={() => setFilter('expense')} />
            </View>

            {error ? (
              <AppCard padding="md" style={styles.errorCard}>
                <AppText variant="bodyStrong" tone="danger">Data Keuangan belum tersedia</AppText>
                <AppText variant="caption" tone="muted">{error}</AppText>
                <View style={styles.actionsRow}>
                  <AppButton label="Tutup" variant="ghost" size="sm" fullWidth={false} onPress={clearError} />
                  {familyId ? <AppButton label="Coba lagi" variant="secondary" size="sm" fullWidth={false} onPress={() => load(familyId)} /> : null}
                </View>
              </AppCard>
            ) : null}

            {isLoading && transactions.length === 0 ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={colors.primary} />
                <AppText variant="caption" tone="muted">Memuat UangQu...</AppText>
              </View>
            ) : groups.length === 0 ? (
              <AppCard padding="lg" elevated style={styles.emptyCard}>
                <View style={styles.emptyIcon}><AppText variant="title" tone="primary">Rp</AppText></View>
                <AppText variant="section" align="center">Belum ada transaksi</AppText>
                <AppText variant="bodySmall" tone="muted" align="center">Catat pemasukan dan pengeluaran agar saldo tersusun otomatis.</AppText>
                {canManage && filter === 'all' ? <AppButton label="Tambah transaksi pertama" variant="secondary" onPress={openTransactionCreate} /> : null}
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
                        onEdit={() => {setEditingTransaction(transaction); setTransactionEditorVisible(true);}}
                        onDelete={() => confirmDeleteTransaction(transaction)}
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
          onPress={openTransactionCreate}
          label="Transaksi"
          extended
          style={styles.fab}
        />
      ) : null}

      <FinanceEditor
        visible={transactionEditorVisible}
        initialTransaction={editingTransaction}
        saving={isSaving}
        onClose={() => setTransactionEditorVisible(false)}
        onSave={(draft, id) => familyId ? saveTransaction(familyId, id, draft) : Promise.resolve(false)}
      />
      <BillEditor
        visible={billEditorVisible}
        initialBill={editingBill}
        saving={isSaving}
        onClose={() => setBillEditorVisible(false)}
        onSave={(draft, id) => familyId ? saveBill(familyId, id, draft) : Promise.resolve(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.background},
  content: {padding: layout.screenPadding, paddingBottom: 130, gap: spacing.xl},
  flexOne: {flex: 1},
  headerIcon: {width: 70, height: 70, borderRadius: 35, backgroundColor: colors.overlayLight, alignItems: 'center', justifyContent: 'center'},
  sedekahBanner: {backgroundColor: colors.primarySoft, borderColor: colors.primaryMuted, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  sedekahIcon: {width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center'},
  moduleToggle: {minHeight: 48, borderRadius: radius.pill, backgroundColor: colors.blueSoft, padding: spacing.xs, flexDirection: 'row'},
  moduleTab: {flex: 1, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center'},
  moduleTabActive: {backgroundColor: colors.surface},
  balanceCard: {backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primaryMuted},
  balanceValue: {marginTop: spacing.xs, marginBottom: spacing.xs},
  overviewGrid: {flexDirection: 'row', gap: spacing.sm},
  overviewCard: {flex: 1, minWidth: 0, borderWidth: 1, borderColor: colors.border, gap: spacing.xs},
  yearCard: {flexDirection: 'row', borderWidth: 1, borderColor: colors.border},
  yearMetric: {flex: 1, gap: spacing.xs},
  yearDivider: {width: 1, backgroundColor: colors.border, marginHorizontal: spacing.md},
  sectionHeader: {flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md},
  billList: {gap: spacing.md},
  billCard: {borderWidth: 1, borderColor: colors.border, gap: spacing.md},
  inactiveCard: {opacity: 0.6},
  billTop: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  billIcon: {width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center'},
  billTitleRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  emptyCompact: {gap: spacing.md, borderWidth: 1, borderColor: colors.border},
  readOnlyCard: {backgroundColor: colors.infoSoft, borderWidth: 1, borderColor: colors.border, gap: spacing.xs},
  filterRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  transactionCard: {borderWidth: 1, borderColor: colors.border, gap: spacing.md},
  transactionTop: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  transactionIcon: {width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center'},
  incomeIcon: {backgroundColor: colors.successSoft},
  expenseIcon: {backgroundColor: colors.dangerSoft},
  amountColumn: {maxWidth: '42%', alignItems: 'flex-end'},
  actionsRow: {flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: spacing.lg},
  historyGroup: {gap: spacing.sm},
  historyList: {gap: spacing.md},
  loadingWrap: {minHeight: 130, alignItems: 'center', justifyContent: 'center', gap: spacing.md},
  emptyCard: {alignItems: 'center', justifyContent: 'center', minHeight: 220, gap: spacing.md},
  emptyIcon: {width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center'},
  errorCard: {backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.danger, gap: spacing.sm},
  fab: {position: 'absolute', right: layout.screenPadding, bottom: spacing.xl},
  modalRoot: {flex: 1, justifyContent: 'flex-end'},
  modalBackdrop: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(8,18,32,0.48)'},
  sheet: {maxHeight: '90%', backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingTop: spacing.sm},
  sheetHandle: {width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md},
  sheetHeader: {flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.md},
  closeButton: {width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center'},
  sheetContent: {paddingHorizontal: spacing.xl, paddingBottom: 44, gap: spacing.lg},
  typeToggle: {height: 48, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, flexDirection: 'row', padding: spacing.xs},
  typeOption: {flex: 1, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center'},
  typeOptionActive: {backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primaryMuted},
  fieldLabel: {marginBottom: spacing.sm, marginLeft: spacing.xs},
  chipWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  quickDateRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  noteInput: {minHeight: 72, paddingVertical: spacing.md, textAlignVertical: 'top'},
});
