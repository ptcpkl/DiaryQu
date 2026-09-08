import {create} from 'zustand';

import {FRONTEND_DEMO_MODE} from '../../../config/appMode';
import {DEMO_FAMILY, DEMO_FAMILY_ID} from '../../../mocks/demoData';
import {familyService} from '../services/familyService';
import type {
  FamilyLoadStatus,
  FamilyMember,
  FamilyMemberLoadStatus,
  FamilySummary,
} from '../types';

interface FamilyState {
  family: FamilySummary | null;
  status: FamilyLoadStatus;
  members: FamilyMember[];
  memberStatus: FamilyMemberLoadStatus;
  isSubmitting: boolean;
  isManaging: boolean;
  error: string | null;
  load: () => Promise<void>;
  loadMembers: () => Promise<void>;
  createFamily: (name: string) => Promise<boolean>;
  joinFamily: (code: string) => Promise<boolean>;
  renameFamily: (name: string) => Promise<boolean>;
  regenerateFamilyCode: () => Promise<boolean>;
  removeMember: (userId: string) => Promise<boolean>;
  transferHead: (userId: string) => Promise<boolean>;
  leaveFamily: () => Promise<boolean>;
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
    return 'Nama keluarga harus terdiri dari 2–100 karakter.';
  }
  if (normalized.includes('INVALID_FAMILY_CODE')) {
    return 'Family Code belum valid.';
  }
  if (normalized.includes('ALREADY_IN_FAMILY')) {
    return 'Akun ini sudah tergabung dalam sebuah Family Room.';
  }
  if (normalized.includes('HEAD_MUST_TRANSFER')) {
    return 'Kepala Keluarga harus memindahkan peran Kepala Keluarga sebelum keluar dari room.';
  }
  if (normalized.includes('HEAD_CANNOT_REMOVE_SELF')) {
    return 'Kepala Keluarga tidak dapat menghapus dirinya sendiri dari room.';
  }
  if (normalized.includes('HEAD_REQUIRED')) {
    return 'Aksi ini hanya dapat dilakukan oleh Kepala Keluarga.';
  }
  if (normalized.includes('MEMBER_NOT_FOUND') || normalized.includes('TARGET_NOT_MEMBER')) {
    return 'Anggota keluarga yang dipilih sudah tidak tersedia.';
  }
  if (
    normalized.includes('UPDATE_FAMILY_NAME') ||
    normalized.includes('REGENERATE_FAMILY_CODE') ||
    normalized.includes('REMOVE_FAMILY_MEMBER') ||
    normalized.includes('TRANSFER_FAMILY_HEAD') ||
    normalized.includes('LEAVE_FAMILY')
  ) {
    return 'Pengaturan Family Room belum siap. Jalankan migration Tahap 9 di Supabase.';
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

export const useFamilyStore = create<FamilyState>((set, get) => ({
  family: null,
  status: 'idle',
  members: [],
  memberStatus: 'idle',
  isSubmitting: false,
  isManaging: false,
  error: null,

  load: async () => {
    set({status: 'loading', error: null});

    if (FRONTEND_DEMO_MODE) {
      set({family: {...DEMO_FAMILY}, status: 'ready', error: null});
      return;
    }

    try {
      const family = await familyService.getCurrentFamily();
      set({family, status: family ? 'ready' : 'empty'});
    } catch (error) {
      set({family: null, status: 'error', error: toFamilyError(error)});
    }
  },

  loadMembers: async () => {
    const family = get().family;
    if (!family) {
      set({members: [], memberStatus: 'ready'});
      return;
    }

    set({memberStatus: 'loading', error: null});
    try {
      const members = await familyService.listMembers(family.id);
      set({members, memberStatus: 'ready'});
    } catch (error) {
      set({memberStatus: 'error', error: toFamilyError(error)});
    }
  },

  createFamily: async name => {
    if (name.trim().length < 2 || name.trim().length > 100) {
      set({error: 'Nama keluarga harus terdiri dari 2–100 karakter.'});
      return false;
    }

    set({isSubmitting: true, error: null});

    if (FRONTEND_DEMO_MODE) {
      set({
        family: {
          ...DEMO_FAMILY,
          name: name.trim(),
          role: 'head',
        },
        status: 'ready',
        isSubmitting: false,
        members: [],
        memberStatus: 'idle',
      });
      return true;
    }

    try {
      const family = await familyService.createFamily(name);
      set({family, status: 'ready', isSubmitting: false, members: [], memberStatus: 'idle'});
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

    if (FRONTEND_DEMO_MODE) {
      set({
        family: {
          id: DEMO_FAMILY_ID,
          name: 'Keluarga Pak Dahlan',
          familyCode: code.trim().toUpperCase(),
          role: 'member',
        },
        status: 'ready',
        isSubmitting: false,
        members: [],
        memberStatus: 'idle',
      });
      return true;
    }

    try {
      const family = await familyService.joinFamily(code);
      set({family, status: 'ready', isSubmitting: false, members: [], memberStatus: 'idle'});
      return true;
    } catch (error) {
      set({isSubmitting: false, error: toFamilyError(error)});
      return false;
    }
  },

  renameFamily: async name => {
    const family = get().family;
    const normalized = name.trim();
    if (!family) return false;
    if (normalized.length < 2 || normalized.length > 100) {
      set({error: 'Nama keluarga harus terdiri dari 2–100 karakter.'});
      return false;
    }

    set({isManaging: true, error: null});
    try {
      await familyService.renameFamily(family.id, normalized);
      set(state => ({
        family: state.family ? {...state.family, name: normalized} : null,
        isManaging: false,
      }));
      return true;
    } catch (error) {
      set({isManaging: false, error: toFamilyError(error)});
      return false;
    }
  },

  regenerateFamilyCode: async () => {
    const family = get().family;
    if (!family) return false;
    set({isManaging: true, error: null});
    try {
      const familyCode = await familyService.regenerateFamilyCode(family.id);
      set(state => ({
        family: state.family ? {...state.family, familyCode} : null,
        isManaging: false,
      }));
      return true;
    } catch (error) {
      set({isManaging: false, error: toFamilyError(error)});
      return false;
    }
  },

  removeMember: async userId => {
    const family = get().family;
    if (!family) return false;
    set({isManaging: true, error: null});
    try {
      await familyService.removeMember(family.id, userId);
      const members = await familyService.listMembers(family.id);
      set({members, memberStatus: 'ready', isManaging: false});
      return true;
    } catch (error) {
      set({isManaging: false, error: toFamilyError(error)});
      return false;
    }
  },

  transferHead: async userId => {
    const family = get().family;
    if (!family) return false;
    set({isManaging: true, error: null});
    try {
      await familyService.transferHead(family.id, userId);
      const members = await familyService.listMembers(family.id);
      set(state => ({
        family: state.family ? {...state.family, role: 'member'} : null,
        members,
        memberStatus: 'ready',
        isManaging: false,
      }));
      return true;
    } catch (error) {
      set({isManaging: false, error: toFamilyError(error)});
      return false;
    }
  },

  leaveFamily: async () => {
    const family = get().family;
    if (!family) return false;
    set({isManaging: true, error: null});
    try {
      await familyService.leaveFamily(family.id);
      set({
        family: null,
        status: 'empty',
        members: [],
        memberStatus: 'idle',
        isManaging: false,
        error: null,
      });
      return true;
    } catch (error) {
      set({isManaging: false, error: toFamilyError(error)});
      return false;
    }
  },

  clearError: () => set({error: null}),
  reset: () =>
    set({
      family: null,
      status: 'idle',
      members: [],
      memberStatus: 'idle',
      isSubmitting: false,
      isManaging: false,
      error: null,
    }),
}));
