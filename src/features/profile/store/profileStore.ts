import {create} from 'zustand';

import {useAuthStore} from '../../auth/store/authStore';
import {profileService} from '../services/profileService';
import type {UserProfile, UserProfileDraft} from '../types';
import {validateProfileDraft} from '../utils/profile';

interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  load: () => Promise<void>;
  save: (draft: UserProfileDraft) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

function profileError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const normalized = raw.toUpperCase();
  if (normalized.includes('AUTH_REQUIRED')) {
    return 'Sesi pengguna sudah tidak tersedia. Silakan masuk kembali.';
  }
  if (normalized.includes('PROFILES') || normalized.includes('RELATION')) {
    return 'Profil belum tersedia. Pastikan migration Family Foundation sudah diterapkan.';
  }
  return 'Profil belum dapat diproses. Silakan coba lagi.';
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  isSaving: false,
  error: null,

  load: async () => {
    if (get().isLoading) return;
    set({isLoading: true, error: null});
    try {
      const profile = await profileService.getMyProfile();
      set({profile, isLoading: false});
      useAuthStore.getState().applyProfileName(profile.fullName);
    } catch (error) {
      set({isLoading: false, error: profileError(error)});
    }
  },

  save: async draft => {
    const validation = validateProfileDraft(draft);
    if (validation) {
      set({error: validation});
      return false;
    }

    set({isSaving: true, error: null});
    try {
      const profile = await profileService.updateMyProfile(draft);
      set({profile, isSaving: false});
      useAuthStore.getState().applyProfileName(profile.fullName);
      return true;
    } catch (error) {
      set({isSaving: false, error: profileError(error)});
      return false;
    }
  },

  clearError: () => set({error: null}),
  reset: () => set({profile: null, isLoading: false, isSaving: false, error: null}),
}));
