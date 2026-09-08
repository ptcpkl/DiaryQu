import {create} from 'zustand';

import {FRONTEND_DEMO_MODE} from '../../../config/appMode';
import {getSupabaseClient} from '../../../lib/supabase/client';
import {DEMO_USER_ID} from '../../../mocks/demoData';
import {trackingService} from '../services/trackingService';
import type {
  NativeLocationPosition,
  SharedFamilyLocation,
  TrackingMember,
} from '../types';

interface TrackingState {
  members: TrackingMember[];
  locations: SharedFamilyLocation[];
  currentUserId: string | null;
  isLoading: boolean;
  isUpdatingLocation: boolean;
  error: string | null;
  currentFamilyId: string | null;
  load: (familyId: string) => Promise<void>;
  shareCurrentLocation: (
    familyId: string,
    position: NativeLocationPosition,
  ) => Promise<boolean>;
  stopSharing: (familyId: string) => Promise<boolean>;
  subscribeFamily: (familyId: string) => () => void;
  clearError: () => void;
}

function trackingError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const normalized = raw.toUpperCase();

  if (
    normalized.includes('FAMILY_MEMBER_LOCATIONS') ||
    normalized.includes('RELATION')
  ) {
    return 'Database Tracking belum siap. Jalankan migration Tahap 8 di Supabase terlebih dahulu.';
  }
  if (normalized.includes('LOCATION_PERMISSION_REQUIRED')) {
    return 'Izin lokasi diperlukan untuk membagikan posisi Anda.';
  }
  if (normalized.includes('LOCATION_UNAVAILABLE')) {
    return 'Lokasi belum tersedia. Pastikan Location/GPS aktif lalu coba lagi.';
  }
  if (normalized.includes('LOCATION_TIMEOUT')) {
    return 'Pengambilan lokasi terlalu lama. Coba lagi di area dengan sinyal lokasi yang lebih baik.';
  }
  if (normalized.includes('AUTH_REQUIRED')) {
    return 'Sesi pengguna sudah tidak tersedia. Silakan masuk kembali.';
  }
  if (normalized.includes('ROW-LEVEL SECURITY') || normalized.includes('42501')) {
    return 'Akses lokasi ditolak oleh perlindungan Family Room.';
  }

  return 'Lokasi keluarga belum dapat diproses. Silakan coba lagi.';
}

async function loadBundle(familyId: string) {
  const [members, locations] = await Promise.all([
    trackingService.listMembers(familyId),
    trackingService.listLocations(familyId),
  ]);
  return {members, locations};
}

export const useTrackingStore = create<TrackingState>((set, get) => ({
  members: [],
  locations: [],
  currentUserId: FRONTEND_DEMO_MODE ? DEMO_USER_ID : null,
  isLoading: false,
  isUpdatingLocation: false,
  error: null,
  currentFamilyId: null,

  load: async familyId => {
    set({isLoading: true, error: null, currentFamilyId: familyId});
    try {
      const bundle = await loadBundle(familyId);
      let currentUserId = get().currentUserId;
      if (!FRONTEND_DEMO_MODE) {
        try {
          const {data} = await getSupabaseClient().auth.getUser();
          currentUserId = data.user?.id ?? null;
        } catch {
          currentUserId = null;
        }
      }
      set({...bundle, currentUserId, isLoading: false});
    } catch (error) {
      set({isLoading: false, error: trackingError(error)});
    }
  },

  shareCurrentLocation: async (familyId, position) => {
    set({isUpdatingLocation: true, error: null});
    try {
      await trackingService.shareMyLocation(familyId, position);
      const bundle = await loadBundle(familyId);
      set({...bundle, isUpdatingLocation: false});
      return true;
    } catch (error) {
      set({isUpdatingLocation: false, error: trackingError(error)});
      return false;
    }
  },

  stopSharing: async familyId => {
    set({isUpdatingLocation: true, error: null});
    try {
      await trackingService.stopSharing(familyId);
      const bundle = await loadBundle(familyId);
      set({...bundle, isUpdatingLocation: false});
      return true;
    } catch (error) {
      set({isUpdatingLocation: false, error: trackingError(error)});
      return false;
    }
  },

  subscribeFamily: familyId =>
    trackingService.subscribe(familyId, () => {
      get().load(familyId).catch(() => undefined);
    }),

  clearError: () => set({error: null}),
}));
