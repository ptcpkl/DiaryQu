import {create} from 'zustand';

import {assetService} from '../services/assetService';
import type {AssetDraft, AssetRecord} from '../types';

type AssetState = {
  assets: AssetRecord[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  currentFamilyId: string | null;
  load: (familyId: string) => Promise<void>;
  saveAsset: (familyId: string, assetId: string | null, draft: AssetDraft) => Promise<boolean>;
  removeAsset: (familyId: string, assetId: string) => Promise<boolean>;
  subscribeFamily: (familyId: string) => () => void;
  clearError: () => void;
};

function assetError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const normalized = raw.toUpperCase();

  if (normalized.includes('FAMILY_ASSETS') || normalized.includes('RELATION')) {
    return 'Database AssetQu belum siap. Jalankan migration Tahap 7 di Supabase terlebih dahulu.';
  }
  if (
    normalized.includes('HEAD_REQUIRED') ||
    normalized.includes('ROW-LEVEL SECURITY') ||
    normalized.includes('42501')
  ) {
    return 'Hanya Kepala Keluarga yang dapat mengubah AssetQu.';
  }
  if (normalized.includes('AUTH_REQUIRED')) {
    return 'Sesi pengguna sudah tidak tersedia. Silakan masuk kembali.';
  }
  return 'Data AssetQu belum dapat diproses. Silakan coba lagi.';
}

export const useAssetStore = create<AssetState>((set, get) => ({
  assets: [],
  isLoading: false,
  isSaving: false,
  error: null,
  currentFamilyId: null,

  load: async familyId => {
    set({isLoading: true, error: null, currentFamilyId: familyId});
    try {
      const assets = await assetService.listAssets(familyId);
      set({assets, isLoading: false});
    } catch (error) {
      set({isLoading: false, error: assetError(error)});
    }
  },

  saveAsset: async (familyId, assetId, draft) => {
    set({isSaving: true, error: null});
    try {
      await assetService.saveAsset(familyId, assetId, draft);
      const assets = await assetService.listAssets(familyId);
      set({assets, isSaving: false});
      return true;
    } catch (error) {
      set({isSaving: false, error: assetError(error)});
      return false;
    }
  },

  removeAsset: async (familyId, assetId) => {
    set({isSaving: true, error: null});
    try {
      await assetService.removeAsset(familyId, assetId);
      const assets = await assetService.listAssets(familyId);
      set({assets, isSaving: false});
      return true;
    } catch (error) {
      set({isSaving: false, error: assetError(error)});
      return false;
    }
  },

  subscribeFamily: familyId =>
    assetService.subscribe(familyId, () => {
      get().load(familyId).catch(() => undefined);
    }),

  clearError: () => set({error: null}),
}));
