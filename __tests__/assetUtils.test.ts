import {
  calculateAssetSummary,
  validateAssetDraft,
} from '../src/features/assets/utils/assets';
import type {AssetRecord} from '../src/features/assets/types';

function asset(overrides: Partial<AssetRecord>): AssetRecord {
  return {
    id: 'asset-1',
    familyId: 'family-1',
    createdBy: 'user-1',
    category: 'savings',
    name: 'Tabungan',
    value: 1000000,
    quantity: null,
    unit: null,
    note: null,
    acquiredOn: null,
    isActive: true,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('AssetQu calculations', () => {
  it('subtracts debt from gross family assets', () => {
    const result = calculateAssetSummary([
      asset({id: 'saving', category: 'savings', value: 10000000}),
      asset({id: 'gold', category: 'gold', value: 5000000}),
      asset({id: 'debt', category: 'debt', value: 4000000}),
      asset({id: 'archived', category: 'land', value: 999000000, isActive: false}),
    ]);

    expect(result.grossAssets).toBe(15000000);
    expect(result.debt).toBe(4000000);
    expect(result.netWorth).toBe(11000000);
    expect(result.activeCount).toBe(3);
  });

  it('validates asset value and optional quantity', () => {
    expect(validateAssetDraft({
      category: 'gold',
      name: 'Emas',
      value: 0,
      quantity: 5,
      unit: 'gram',
      note: null,
      acquiredOn: null,
      isActive: true,
    })).toContain('lebih dari Rp 0');

    expect(validateAssetDraft({
      category: 'gold',
      name: 'Emas',
      value: 8000000,
      quantity: 5,
      unit: 'gram',
      note: null,
      acquiredOn: '2026-05-01',
      isActive: true,
    })).toBeNull();
  });
});
