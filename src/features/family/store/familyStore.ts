import {create} from 'zustand';

import {familyService} from '../services/familyService';
import type {FamilyLoadStatus, FamilySummary} from '../types';

interface FamilyState {
  family: FamilySummary | null;
  status: FamilyLoadStatus;
  isSubmitting: boolean;
  error: string | null;
  load: () => Promise<void>;
  createFamily: (name: string) => Promise<boolean>;
  joinFamily: (code: string) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

function toFamilyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const normalized = message.toUpperCase();

  if (normalized.includes('FAMILY_NOT_FOUND')) {
    return 'Family Code tidak ditemukan. Periksa kembali kode yang dimasukkan.';
  }
  if (normalized.includes('INVALID_FAMILY_NAME')) {
    return 'Nama keluarga minimal terdiri dari 2 karakter.';
  }
  if (normalized.includes('INVALID_FAMILY_CODE')) {
    return 'Family Code belum valid.';
  }
  if (normalized.includes('ALREADY_IN_FAMILY')) {
    return 'Akun ini sudah tergabung dalam sebuah Family Room.';
  }
  if (
    normalized.includes('FAMILY_MEMBERS') ||
    normalized.includes('CREATE_FAMILY') ||
    normalized.includes('JOIN_FAMILY')
  ) {
    return 'Database DiaryQu belum siap. Migration Family Room perlu diterapkan ke Supabase.';
  }

  return 'Family Room belum dapat diproses. Silakan coba lagi.';
}

export const useFamilyStore = create<FamilyState>(set => ({
  family: null,
  status: 'idle',
  isSubmitting: false,
  error: null,

  load: async () => {
    set({status: 'loading', error: null});
    try {
      const family = await familyService.getCurrentFamily();
      set({family, status: family ? 'ready' : 'empty'});
    } catch (error) {
      set({family: null, status: 'error', error: toFamilyError(error)});
    }
  },

  createFamily: async name => {
    if (name.trim().length < 2) {
      set({error: 'Nama keluarga minimal terdiri dari 2 karakter.'});
      return false;
    }

    set({isSubmitting: true, error: null});
    try {
      const family = await familyService.createFamily(name);
      set({family, status: 'ready', isSubmitting: false});
      return true;
    } catch (error) {
      set({isSubmitting: false, error: toFamilyError(error)});
      return false;
    }
  },

  joinFamily: async code => {
    if (!code.trim()) {
      set({error: 'Masukkan Family Code terlebih dahulu.'});
      return false;
    }

    set({isSubmitting: true, error: null});
    try {
      const family = await familyService.joinFamily(code);
      set({family, status: 'ready', isSubmitting: false});
      return true;
    } catch (error) {
      set({isSubmitting: false, error: toFamilyError(error)});
      return false;
    }
  },

  clearError: () => set({error: null}),
  reset: () =>
    set({
      family: null,
      status: 'idle',
      isSubmitting: false,
      error: null,
    }),
}));
