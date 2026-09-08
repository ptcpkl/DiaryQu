export type AssetCategory = 'savings' | 'gold' | 'land' | 'garden' | 'debt';

export interface AssetRecord {
  id: string;
  familyId: string;
  createdBy: string;
  category: AssetCategory;
  name: string;
  value: number;
  quantity: number | null;
  unit: string | null;
  note: string | null;
  acquiredOn: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssetDraft {
  category: AssetCategory;
  name: string;
  value: number;
  quantity: number | null;
  unit: string | null;
  note: string | null;
  acquiredOn: string | null;
  isActive: boolean;
}

export interface AssetSummary {
  grossAssets: number;
  debt: number;
  netWorth: number;
  activeCount: number;
}

export type AssetFilter = 'all' | AssetCategory;
