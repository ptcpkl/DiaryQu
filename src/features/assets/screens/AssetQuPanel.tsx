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

import {
  AppButton,
  AppCard,
  AppText,
  Chip,
  TextField,
} from '../../../components/ui';
import {colors, radius, spacing} from '../../../constants/theme';
import {formatRupiah, parseRupiahInput} from '../../finance/utils/finance';
import {useAssetStore} from '../store/assetStore';
import type {AssetCategory, AssetDraft, AssetFilter, AssetRecord} from '../types';
import {
  ASSET_CATEGORIES,
  ASSET_CATEGORY_META,
  calculateAssetSummary,
  sortAssets,
  validateAssetDraft,
} from '../utils/assets';

type EditorState = {
  asset: AssetRecord | null;
  category: AssetCategory;
  name: string;
  valueText: string;
  quantityText: string;
  unit: string;
  note: string;
  acquiredOn: string;
  isActive: boolean;
  error: string | null;
};

function editorState(asset: AssetRecord | null): EditorState {
  const category = asset?.category ?? 'savings';
  return {
    asset,
    category,
    name: asset?.name ?? '',
    valueText: asset ? String(asset.value) : '',
    quantityText: asset?.quantity === null || asset?.quantity === undefined ? '' : String(asset.quantity),
    unit: asset?.unit ?? ASSET_CATEGORY_META[category].defaultUnit ?? '',
    note: asset?.note ?? '',
    acquiredOn: asset?.acquiredOn ?? '',
    isActive: asset?.isActive ?? true,
    error: null,
  };
}

function AssetEditor({
  visible,
  initialAsset,
  saving,
  onClose,
  onSave,
}: {
  visible: boolean;
  initialAsset: AssetRecord | null;
  saving: boolean;
  onClose: () => void;
  onSave: (draft: AssetDraft, id: string | null) => Promise<boolean>;
}) {
  const [state, setState] = useState(() => editorState(initialAsset));

  useEffect(() => {
    if (visible) setState(editorState(initialAsset));
  }, [visible, initialAsset]);

  const value = parseRupiahInput(state.valueText);
  const quantity = state.quantityText.trim()
    ? Number(state.quantityText.replace(',', '.'))
    : null;

  const selectCategory = (category: AssetCategory) => {
    const defaultUnit = ASSET_CATEGORY_META[category].defaultUnit ?? '';
    setState(current => ({
      ...current,
      category,
      unit: current.asset ? current.unit : defaultUnit,
      error: null,
    }));
  };

  const submit = async () => {
    const draft: AssetDraft = {
      category: state.category,
      name: state.name.trim(),
      value,
      quantity: quantity !== null && Number.isFinite(quantity) ? quantity : null,
      unit: state.unit.trim() || null,
      note: state.note.trim() || null,
      acquiredOn: state.acquiredOn.trim() || null,
      isActive: state.isActive,
    };
    const error = validateAssetDraft(draft);
    if (error) {
      setState(current => ({...current, error}));
      return;
    }
    const ok = await onSave(draft, state.asset?.id ?? null);
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
            <View style={styles.flexOne}>
              <AppText variant="heading">{state.asset ? 'Edit AssetQu' : 'Tambah AssetQu'}</AppText>
              <AppText variant="caption" tone="muted">Catat nilai aset dan kewajiban keluarga.</AppText>
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
              <AppText variant="section">×</AppText>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.sheetContent}>
            <View>
              <AppText variant="label" tone="secondary" style={styles.fieldLabel}>Kategori</AppText>
              <View style={styles.chipWrap}>
                {ASSET_CATEGORIES.map(category => (
                  <Chip
                    key={category}
                    label={ASSET_CATEGORY_META[category].label}
                    selected={state.category === category}
                    tone={category === 'debt' ? 'danger' : state.category === category ? 'primary' : 'neutral'}
                    onPress={() => selectCategory(category)}
                  />
                ))}
              </View>
            </View>

            <TextField
              label={state.category === 'debt' ? 'Nama hutang' : 'Nama aset'}
              value={state.name}
              onChangeText={name => setState(current => ({...current, name, error: null}))}
              placeholder={state.category === 'gold' ? 'Contoh: Emas Batangan' : 'Contoh: Tabungan Keluarga'}
              maxLength={120}
            />

            <TextField
              label={state.category === 'debt' ? 'Sisa nilai hutang' : 'Estimasi nilai saat ini'}
              value={state.valueText ? formatRupiah(value).replace('Rp ', '') : ''}
              onChangeText={text => setState(current => ({...current, valueText: String(parseRupiahInput(text) || ''), error: null}))}
              keyboardType="number-pad"
              placeholder="0"
              leftAdornment={<AppText variant="bodyStrong" tone="primary">Rp</AppText>}
            />

            <View style={styles.twoFields}>
              <TextField
                label="Jumlah / luas"
                value={state.quantityText}
                onChangeText={quantityText => setState(current => ({...current, quantityText, error: null}))}
                keyboardType="decimal-pad"
                placeholder="Opsional"
                containerStyle={styles.flexOne}
              />
              <TextField
                label="Satuan"
                value={state.unit}
                onChangeText={unit => setState(current => ({...current, unit, error: null}))}
                placeholder="gram / m²"
                maxLength={30}
                containerStyle={styles.flexOne}
              />
            </View>

            <TextField
              label="Tanggal diperoleh"
              value={state.acquiredOn}
              onChangeText={acquiredOn => setState(current => ({...current, acquiredOn, error: null}))}
              placeholder="YYYY-MM-DD (opsional)"
              autoCapitalize="none"
            />

            <TextField
              label="Catatan"
              value={state.note}
              onChangeText={note => setState(current => ({...current, note, error: null}))}
              placeholder="Lokasi, nomor sertifikat internal, tujuan tabungan, dan lainnya"
              multiline
              maxLength={500}
              inputStyle={styles.noteInput}
            />

            <View>
              <AppText variant="label" tone="secondary" style={styles.fieldLabel}>Status</AppText>
              <View style={styles.statusRow}>
                <Chip
                  label="Aktif"
                  selected={state.isActive}
                  tone="success"
                  onPress={() => setState(current => ({...current, isActive: true, error: null}))}
                />
                <Chip
                  label="Diarsipkan"
                  selected={!state.isActive}
                  onPress={() => setState(current => ({...current, isActive: false, error: null}))}
                />
              </View>
            </View>

            {state.error ? (
              <AppCard padding="sm" style={styles.errorCard}>
                <AppText variant="caption" tone="danger">{state.error}</AppText>
              </AppCard>
            ) : null}

            <AppButton
              label={state.asset ? 'Simpan Perubahan' : 'Simpan Aset'}
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

function AssetCard({
  asset,
  canManage,
  onEdit,
  onDelete,
}: {
  asset: AssetRecord;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = ASSET_CATEGORY_META[asset.category];
  const debt = asset.category === 'debt';
  return (
    <AppCard padding="md" style={[styles.assetCard, !asset.isActive ? styles.assetCardInactive : undefined]}>
      <View style={styles.assetTop}>
        <View style={[styles.assetIcon, debt ? styles.assetIconDebt : styles.assetIconDefault]}>
          <AppText variant="section" tone={debt ? 'danger' : 'primary'}>{meta.glyph}</AppText>
        </View>
        <View style={styles.flexOne}>
          <View style={styles.assetTitleRow}>
            <AppText variant="bodyStrong" numberOfLines={1} style={styles.flexOne}>{asset.name}</AppText>
            {!asset.isActive ? <Chip label="Arsip" /> : null}
          </View>
          <AppText variant="caption" tone="muted">{meta.label}</AppText>
        </View>
        <AppText variant="bodyStrong" tone={debt ? 'danger' : 'primary'} align="right">
          {debt ? '- ' : ''}{formatRupiah(asset.value)}
        </AppText>
      </View>

      {asset.quantity !== null || asset.note ? (
        <View style={styles.assetMeta}>
          {asset.quantity !== null ? (
            <AppText variant="caption" tone="muted">
              {asset.quantity.toLocaleString('id-ID')} {asset.unit ?? ''}
            </AppText>
          ) : null}
          {asset.note ? (
            <AppText variant="caption" tone="muted" numberOfLines={2}>{asset.note}</AppText>
          ) : null}
        </View>
      ) : null}

      {canManage ? (
        <View style={styles.actionsRow}>
          <Pressable onPress={onEdit} hitSlop={8}><AppText variant="label" tone="primary">Edit</AppText></Pressable>
          <Pressable onPress={onDelete} hitSlop={8}><AppText variant="label" tone="danger">Hapus</AppText></Pressable>
        </View>
      ) : null}
    </AppCard>
  );
}

export function AssetQuPanel({
  familyId,
  canManage,
}: {
  familyId: string | null;
  canManage: boolean;
}) {
  const assets = useAssetStore(state => state.assets);
  const isLoading = useAssetStore(state => state.isLoading);
  const isSaving = useAssetStore(state => state.isSaving);
  const error = useAssetStore(state => state.error);
  const load = useAssetStore(state => state.load);
  const saveAsset = useAssetStore(state => state.saveAsset);
  const removeAsset = useAssetStore(state => state.removeAsset);
  const subscribeFamily = useAssetStore(state => state.subscribeFamily);
  const clearError = useAssetStore(state => state.clearError);

  const [filter, setFilter] = useState<AssetFilter>('all');
  const [editorVisible, setEditorVisible] = useState(false);
  const [editing, setEditing] = useState<AssetRecord | null>(null);

  useEffect(() => {
    if (!familyId) return;
    load(familyId).catch(() => undefined);
    const unsubscribe = subscribeFamily(familyId);
    return unsubscribe;
  }, [familyId, load, subscribeFamily]);

  const summary = useMemo(() => calculateAssetSummary(assets), [assets]);
  const filtered = useMemo(
    () => sortAssets(assets.filter(asset => filter === 'all' || asset.category === filter)),
    [assets, filter],
  );

  const openCreate = () => {
    setEditing(null);
    setEditorVisible(true);
  };

  const openEdit = (asset: AssetRecord) => {
    setEditing(asset);
    setEditorVisible(true);
  };

  const confirmDelete = (asset: AssetRecord) => {
    if (!familyId) return;
    Alert.alert('Hapus catatan AssetQu?', `${asset.name} akan dihapus permanen dari AssetQu.`, [
      {text: 'Batal', style: 'cancel'},
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => removeAsset(familyId, asset.id).catch(() => undefined),
      },
    ]);
  };

  const handleSave = async (draft: AssetDraft, id: string | null) => {
    if (!familyId) return false;
    return saveAsset(familyId, id, draft);
  };

  return (
    <View style={styles.panel}>
      <AppCard padding="lg" style={styles.netWorthCard}>
        <AppText variant="micro" tone="onPrimary">NILAI BERSIH KELUARGA</AppText>
        <AppText variant="display" tone="onPrimary" style={styles.netWorthValue}>
          {summary.netWorth < 0 ? '- ' : ''}{formatRupiah(summary.netWorth)}
        </AppText>
        <View style={styles.summaryRow}>
          <View style={styles.summaryMetric}>
            <AppText variant="micro" tone="onPrimary">Total Aset</AppText>
            <AppText variant="bodyStrong" tone="onPrimary">{formatRupiah(summary.grossAssets)}</AppText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryMetric}>
            <AppText variant="micro" tone="onPrimary">Total Hutang</AppText>
            <AppText variant="bodyStrong" tone="onPrimary">{formatRupiah(summary.debt)}</AppText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryMetric}>
            <AppText variant="micro" tone="onPrimary">Catatan Aktif</AppText>
            <AppText variant="bodyStrong" tone="onPrimary">{summary.activeCount}</AppText>
          </View>
        </View>
      </AppCard>

      <View style={styles.sectionHeader}>
        <View>
          <AppText variant="section">AssetQu</AppText>
          <AppText variant="caption" tone="muted">Tabungan, emas, tanah, kebun, dan hutang keluarga.</AppText>
        </View>
        {canManage ? (
          <Pressable onPress={openCreate} hitSlop={8}>
            <AppText variant="label" tone="primary">+ Tambah</AppText>
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
        <Chip label="Semua" selected={filter === 'all'} onPress={() => setFilter('all')} />
        {ASSET_CATEGORIES.map(category => (
          <Chip
            key={category}
            label={ASSET_CATEGORY_META[category].label}
            selected={filter === category}
            tone={category === 'debt' ? 'danger' : 'neutral'}
            onPress={() => setFilter(category)}
          />
        ))}
      </ScrollView>

      {!canManage ? (
        <AppCard padding="md" style={styles.readOnlyCard}>
          <AppText variant="bodyStrong">Mode transparansi keluarga</AppText>
          <AppText variant="caption" tone="muted">Anggota dapat melihat AssetQu. Perubahan dikelola Kepala Keluarga.</AppText>
        </AppCard>
      ) : null}

      {error ? (
        <AppCard padding="md" style={styles.errorCard}>
          <AppText variant="bodyStrong" tone="danger">AssetQu belum tersedia</AppText>
          <AppText variant="caption" tone="muted">{error}</AppText>
          <View style={styles.actionsRow}>
            <AppButton label="Tutup" variant="ghost" size="sm" fullWidth={false} onPress={clearError} />
            {familyId ? <AppButton label="Coba lagi" variant="secondary" size="sm" fullWidth={false} onPress={() => load(familyId)} /> : null}
          </View>
        </AppCard>
      ) : null}

      {isLoading && assets.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
          <AppText variant="caption" tone="muted">Memuat AssetQu...</AppText>
        </View>
      ) : filtered.length === 0 ? (
        <AppCard padding="lg" elevated style={styles.emptyCard}>
          <View style={styles.emptyIcon}><AppText variant="title" tone="primary">◇</AppText></View>
          <AppText variant="section" align="center">Belum ada catatan AssetQu</AppText>
          <AppText variant="bodySmall" tone="muted" align="center">Catat aset dan kewajiban agar nilai bersih keluarga mudah dipantau.</AppText>
          {canManage ? <AppButton label="Tambah AssetQu pertama" variant="secondary" onPress={openCreate} /> : null}
        </AppCard>
      ) : (
        <View style={styles.assetList}>
          {filtered.map(asset => (
            <AssetCard
              key={asset.id}
              asset={asset}
              canManage={canManage}
              onEdit={() => openEdit(asset)}
              onDelete={() => confirmDelete(asset)}
            />
          ))}
        </View>
      )}

      <AssetEditor
        visible={editorVisible}
        initialAsset={editing}
        saving={isSaving}
        onClose={() => setEditorVisible(false)}
        onSave={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {gap: spacing.xl},
  flexOne: {flex: 1},
  netWorthCard: {backgroundColor: colors.primary, overflow: 'hidden'},
  netWorthValue: {marginTop: spacing.xs},
  summaryRow: {flexDirection: 'row', marginTop: spacing.lg, alignItems: 'stretch'},
  summaryMetric: {flex: 1, gap: spacing.xs},
  summaryDivider: {width: 1, backgroundColor: colors.overlayLight, marginHorizontal: spacing.sm},
  sectionHeader: {flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md},
  filterContent: {gap: spacing.sm, paddingRight: spacing.lg},
  readOnlyCard: {backgroundColor: colors.infoSoft, borderWidth: 1, borderColor: colors.border, gap: spacing.xs},
  errorCard: {backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.danger, gap: spacing.sm},
  assetList: {gap: spacing.md},
  assetCard: {borderWidth: 1, borderColor: colors.border, gap: spacing.md},
  assetCardInactive: {opacity: 0.6},
  assetTop: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  assetIcon: {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
  assetIconDefault: {backgroundColor: colors.primarySoft},
  assetIconDebt: {backgroundColor: colors.dangerSoft},
  assetTitleRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  assetMeta: {gap: spacing.xs, paddingLeft: 56},
  actionsRow: {flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: spacing.lg},
  loadingWrap: {minHeight: 130, alignItems: 'center', justifyContent: 'center', gap: spacing.md},
  emptyCard: {alignItems: 'center', gap: spacing.md, minHeight: 220, justifyContent: 'center'},
  emptyIcon: {width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center'},
  modalRoot: {flex: 1, justifyContent: 'flex-end'},
  modalBackdrop: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(8,18,32,0.48)'},
  sheet: {maxHeight: '90%', backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingTop: spacing.sm},
  sheetHandle: {width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md},
  sheetHeader: {flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.md},
  closeButton: {width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center'},
  sheetContent: {paddingHorizontal: spacing.xl, paddingBottom: 44, gap: spacing.lg},
  fieldLabel: {marginBottom: spacing.sm, marginLeft: spacing.xs},
  chipWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  statusRow: {flexDirection: 'row', gap: spacing.sm},
  twoFields: {flexDirection: 'row', gap: spacing.md},
  noteInput: {minHeight: 72, paddingVertical: spacing.md, textAlignVertical: 'top'},
});
