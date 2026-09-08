import {create} from 'zustand';

import {routineProofStorage} from '../services/routineProofStorage';
import {routineService} from '../services/routineService';
import type {
  PickedRoutineProof,
  RoutineDefinition,
  RoutineDraft,
  RoutineMember,
  RoutineSubmission,
} from '../types';
import {addDays, dateFromKey, localDateKey} from '../utils/schedule';

type RoutineState = {
  members: RoutineMember[];
  routines: RoutineDefinition[];
  submissions: RoutineSubmission[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  currentFamilyId: string | null;
  currentDateKey: string | null;
  load: (familyId: string, dateKey: string) => Promise<void>;
  saveRoutine: (familyId: string, routineId: string | null, draft: RoutineDraft) => Promise<boolean>;
  removeRoutine: (familyId: string, routineId: string) => Promise<boolean>;
  submitCompletion: (input: {
    familyId: string;
    userId: string;
    routine: RoutineDefinition;
    occurrenceDate: string;
    proof: PickedRoutineProof | null;
    note: string | null;
  }) => Promise<boolean>;
  reviewSubmission: (input: {
    familyId: string;
    reviewerId: string;
    submissionId: string;
    decision: 'approved' | 'rejected';
    note: string | null;
  }) => Promise<boolean>;
  subscribeFamily: (familyId: string) => () => void;
  clearError: () => void;
};

function routineError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const normalized = raw.toUpperCase();

  if (
    normalized.includes('ROUTINE_DEFINITIONS') ||
    normalized.includes('SAVE_FAMILY_ROUTINE') ||
    normalized.includes('SUBMIT_ROUTINE_COMPLETION')
  ) {
    return 'Database Rutinitas belum siap. Jalankan migration Rutinitas terbaru di Supabase terlebih dahulu.';
  }
  if (normalized.includes('ROUTINE-PROOFS') || normalized.includes('BUCKET')) {
    return 'Penyimpanan bukti Rutinitas belum siap. Jalankan bagian Storage pada migration Tahap 5.';
  }
  if (normalized.includes('SELF_APPROVAL')) {
    return 'Bukti rutinitas tidak boleh disetujui oleh orang yang mengirim bukti tersebut.';
  }
  if (normalized.includes('ALREADY_APPROVED')) {
    return 'Rutinitas ini sudah disetujui dan tidak dapat dikirim ulang.';
  }
  if (normalized.includes('NOT_ASSIGNED')) {
    return 'Rutinitas ini tidak ditugaskan kepada akun Anda.';
  }
  if (normalized.includes('FUTURE')) {
    return 'Bukti rutinitas untuk tanggal yang belum terjadi tidak dapat dikirim.';
  }
  if (normalized.includes('PROOF_REQUIRED')) {
    return 'Rutinitas ini membutuhkan bukti foto.';
  }
  if (
    normalized.includes('OWNER_REQUIRED') ||
    normalized.includes('SELF_ASSIGNMENT_REQUIRED')
  ) {
    return 'Anggota hanya dapat mengelola rutinitas yang dibuat dan ditugaskan untuk dirinya sendiri.';
  }
  if (normalized.includes('FAMILY_MEMBER_REQUIRED')) {
    return 'Akun ini tidak lagi tergabung dalam Family Room tersebut.';
  }
  if (normalized.includes('ROW-LEVEL SECURITY') || normalized.includes('42501')) {
    return 'Akun ini tidak memiliki izin untuk melakukan tindakan tersebut.';
  }
  if (normalized.includes('PICKER')) {
    return 'Pemilih foto belum tersedia di perangkat ini.';
  }

  return 'Rutinitas belum dapat diproses. Silakan coba lagi.';
}

async function loadAll(familyId: string, dateKey: string) {
  const selected = dateFromKey(dateKey) ?? new Date();
  const today = new Date();
  const end = selected.getTime() > today.getTime() ? selected : today;
  const startKey = localDateKey(addDays(selected, -30));
  const endKey = localDateKey(addDays(end, 1));

  const [members, routines, submissions] = await Promise.all([
    routineService.listMembers(familyId),
    routineService.listRoutines(familyId),
    routineService.listSubmissions(familyId, startKey, endKey),
  ]);
  return {members, routines, submissions};
}

export const useRoutineStore = create<RoutineState>((set, get) => ({
  members: [],
  routines: [],
  submissions: [],
  isLoading: false,
  isSaving: false,
  error: null,
  currentFamilyId: null,
  currentDateKey: null,

  load: async (familyId, dateKey) => {
    set({isLoading: true, error: null, currentFamilyId: familyId, currentDateKey: dateKey});
    try {
      const data = await loadAll(familyId, dateKey);
      set({...data, isLoading: false});
    } catch (error) {
      set({isLoading: false, error: routineError(error)});
    }
  },

  saveRoutine: async (familyId, routineId, draft) => {
    set({isSaving: true, error: null});
    try {
      await routineService.saveRoutine(familyId, routineId, draft);
      const dateKey = get().currentDateKey ?? localDateKey(new Date());
      const data = await loadAll(familyId, dateKey);
      set({...data, isSaving: false});
      return true;
    } catch (error) {
      set({isSaving: false, error: routineError(error)});
      return false;
    }
  },

  removeRoutine: async (familyId, routineId) => {
    set({isSaving: true, error: null});
    try {
      await routineService.removeRoutine(routineId);
      const dateKey = get().currentDateKey ?? localDateKey(new Date());
      const data = await loadAll(familyId, dateKey);
      set({...data, isSaving: false});
      return true;
    } catch (error) {
      set({isSaving: false, error: routineError(error)});
      return false;
    }
  },

  submitCompletion: async ({familyId, userId, routine, occurrenceDate, proof, note}) => {
    set({isSaving: true, error: null});
    try {
      if (routine.proofRequired && !proof) {
        throw new Error('ROUTINE_PROOF_REQUIRED');
      }

      const proofPath = proof
        ? await routineProofStorage.upload(familyId, userId, routine.id, occurrenceDate, proof)
        : null;

      await routineService.submitCompletion({
        routineId: routine.id,
        familyId,
        memberId: userId,
        occurrenceDate,
        proofPath,
        proofMime: proof?.mimeType ?? null,
        note: note?.trim() || null,
      });

      const dateKey = get().currentDateKey ?? occurrenceDate;
      const data = await loadAll(familyId, dateKey);
      set({...data, isSaving: false});
      return true;
    } catch (error) {
      set({isSaving: false, error: routineError(error)});
      return false;
    }
  },

  reviewSubmission: async ({familyId, reviewerId, submissionId, decision, note}) => {
    set({isSaving: true, error: null});
    try {
      await routineService.reviewSubmission(submissionId, reviewerId, decision, note?.trim() || null);
      const dateKey = get().currentDateKey ?? localDateKey(new Date());
      const data = await loadAll(familyId, dateKey);
      set({...data, isSaving: false});
      return true;
    } catch (error) {
      set({isSaving: false, error: routineError(error)});
      return false;
    }
  },

  subscribeFamily: familyId =>
    routineService.subscribe(familyId, () => {
      const dateKey = get().currentDateKey ?? localDateKey(new Date());
      get().load(familyId, dateKey).catch(() => undefined);
    }),

  clearError: () => set({error: null}),
}));
