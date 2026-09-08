import type {AssetCategory, AssetDraft, AssetRecord, AssetSummary} from '../types';

export const ASSET_CATEGORY_META: Record<
  AssetCategory,
  {label: string; glyph: string; defaultUnit: string | null}
> = {
  savings: {label: 'Tabungan', glyph: 'Rp', defaultUnit: null},
  gold: {label: 'Emas', glyph: '◆', defaultUnit: 'gram'},
  land: {label: 'Tanah', glyph: '▱', defaultUnit: 'm²'},
  garden: {label: 'Kebun', glyph: '♧', defaultUnit: 'm²'},
  debt: {label: 'Hutang', glyph: '!', defaultUnit: null},
};

export const ASSET_CATEGORIES = Object.keys(ASSET_CATEGORY_META) as AssetCategory[];

export function calculateAssetSummary(assets: AssetRecord[]): AssetSummary {
  let grossAssets = 0;
  let debt = 0;
  let activeCount = 0;

  assets.forEach(asset => {
    if (!asset.isActive) return;
    activeCount += 1;
    if (asset.category === 'debt') debt += asset.value;
    else grossAssets += asset.value;
  });

  return {
    grossAssets,
    debt,
    netWorth: grossAssets - debt,
    activeCount,
  };
}

export function validateAssetDraft(draft: AssetDraft): string | null {
  if (draft.name.trim().length < 2) return 'Nama aset minimal 2 karakter.';
  if (!Number.isSafeInteger(draft.value) || draft.value <= 0) {
    return draft.category === 'debt'
      ? 'Nilai hutang harus lebih dari Rp 0.'
      : 'Nilai aset harus lebih dari Rp 0.';
  }
  if (draft.value > 9_000_000_000_000) return 'Nilai aset terlalu besar.';
  if (draft.quantity !== null && (!Number.isFinite(draft.quantity) || draft.quantity <= 0)) {
    return 'Jumlah/luas harus lebih dari 0.';
  }
  if ((draft.unit?.length ?? 0) > 30) return 'Satuan maksimal 30 karakter.';
  if ((draft.note?.length ?? 0) > 500) return 'Catatan maksimal 500 karakter.';
  if (draft.acquiredOn && !/^\d{4}-\d{2}-\d{2}$/.test(draft.acquiredOn)) {
    return 'Tanggal harus menggunakan format YYYY-MM-DD.';
  }
  return null;
}

export function sortAssets(assets: AssetRecord[]): AssetRecord[] {
  return [...assets].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}
