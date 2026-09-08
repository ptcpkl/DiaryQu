import {FRONTEND_DEMO_MODE} from '../../../config/appMode';
import {getSupabaseClient} from '../../../lib/supabase/client';
import {DEMO_FAMILY_ID, DEMO_USER_ID} from '../../../mocks/demoData';
import type {
  RoutineDefinition,
  RoutineDraft,
  RoutineMember,
  RoutineScheduleType,
  RoutineSubmission,
  RoutineSubmissionStatus,
} from '../types';
import {localDateKey} from '../utils/schedule';
import {routineProofStorage} from './routineProofStorage';

type RoutineRow = {
  id: string;
  family_id: string;
  created_by: string;
  title: string;
  description: string | null;
  schedule_type: RoutineScheduleType;
  weekdays: number[] | null;
  start_date: string;
  end_date: string | null;
  reward_points: number;
  proof_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type AssignmentRow = {routine_id: string; member_id: string};
type FamilyMemberRow = {user_id: string; role: RoutineMember['role']};
type ProfileRow = {id: string; full_name: string; avatar_url: string | null};
type SubmissionRow = {
  id: string;
  routine_id: string;
  family_id: string;
  member_id: string;
  occurrence_date: string;
  proof_path: string | null;
  proof_mime: string | null;
  proof_note: string | null;
  status: RoutineSubmissionStatus;
  review_note: string | null;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  updated_at: string;
};

function toRoutine(row: RoutineRow, assignments: AssignmentRow[]): RoutineDefinition {
  return {
    id: row.id,
    familyId: row.family_id,
    createdBy: row.created_by,
    title: row.title,
    description: row.description,
    scheduleType: row.schedule_type,
    weekdays: row.weekdays ?? [],
    startDate: row.start_date,
    endDate: row.end_date,
    rewardPoints: row.reward_points,
    proofRequired: row.proof_required,
    isActive: row.is_active,
    assigneeIds: assignments.filter(item => item.routine_id === row.id).map(item => item.member_id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function toSubmission(row: SubmissionRow): Promise<RoutineSubmission> {
  return {
    id: row.id,
    routineId: row.routine_id,
    familyId: row.family_id,
    memberId: row.member_id,
    occurrenceDate: row.occurrence_date,
    proofPath: row.proof_path,
    proofMime: row.proof_mime,
    proofNote: row.proof_note,
    proofUrl: await routineProofStorage.signedUrl(row.proof_path),
    status: row.status,
    reviewNote: row.review_note,
    submittedAt: row.submitted_at,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    updatedAt: row.updated_at,
  };
}

const DEMO_MEMBER_CHILD = '33333333-3333-4333-8333-333333333333';
const DEMO_MEMBER_MOTHER = '44444444-4444-4444-8444-444444444444';
const demoToday = () => localDateKey(new Date());

let demoMembers: RoutineMember[] = [
  {id: DEMO_USER_ID, fullName: 'Pak Dahlan', avatarUrl: null, role: 'head'},
  {id: DEMO_MEMBER_MOTHER, fullName: 'Bu Rina', avatarUrl: null, role: 'member'},
  {id: DEMO_MEMBER_CHILD, fullName: 'Alya', avatarUrl: null, role: 'member'},
];
let demoRoutines: RoutineDefinition[] = [
  {
    id: 'demo-routine-1',
    familyId: DEMO_FAMILY_ID,
    createdBy: DEMO_USER_ID,
    title: 'Rapikan ruang keluarga',
    description: 'Rapikan meja, sofa, dan barang yang tidak pada tempatnya.',
    scheduleType: 'daily',
    weekdays: [],
    startDate: demoToday(),
    endDate: null,
    rewardPoints: 10,
    proofRequired: true,
    isActive: true,
    assigneeIds: [DEMO_USER_ID, DEMO_MEMBER_CHILD],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-routine-2',
    familyId: DEMO_FAMILY_ID,
    createdBy: DEMO_USER_ID,
    title: 'Baca Al-Qur’an',
    description: 'Luangkan waktu untuk tilawah setelah Maghrib.',
    scheduleType: 'daily',
    weekdays: [],
    startDate: demoToday(),
    endDate: null,
    rewardPoints: 15,
    proofRequired: false,
    isActive: true,
    assigneeIds: [DEMO_MEMBER_MOTHER, DEMO_MEMBER_CHILD],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
let demoSubmissions: RoutineSubmission[] = [
  {
    id: 'demo-submission-1',
    routineId: 'demo-routine-1',
    familyId: DEMO_FAMILY_ID,
    memberId: DEMO_MEMBER_CHILD,
    occurrenceDate: demoToday(),
    proofPath: 'demo://routine-proof',
    proofMime: 'image/jpeg',
    proofNote: 'Sudah dirapikan setelah sarapan.',
    proofUrl: null,
    status: 'pending',
    reviewNote: null,
    submittedAt: new Date().toISOString(),
    reviewedBy: null,
    reviewedAt: null,
    updatedAt: new Date().toISOString(),
  },
];

function demoId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const routineService = {
  async listMembers(familyId: string): Promise<RoutineMember[]> {
    if (FRONTEND_DEMO_MODE) {
      return familyId === DEMO_FAMILY_ID ? [...demoMembers] : [];
    }

    const client = getSupabaseClient();
    const {data: memberships, error: membershipError} = await client
      .from('family_members')
      .select('user_id, role')
      .eq('family_id', familyId)
      .order('joined_at', {ascending: true});
    if (membershipError) throw membershipError;

    const membershipRows = (memberships ?? []) as FamilyMemberRow[];
    const ids = membershipRows.map(item => item.user_id);
    if (ids.length === 0) return [];

    const {data: profiles, error: profileError} = await client
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', ids);
    if (profileError) throw profileError;

    const profileMap = new Map((profiles ?? []).map(row => [(row as ProfileRow).id, row as ProfileRow]));
    return membershipRows.map(member => {
      const profile = profileMap.get(member.user_id);
      return {
        id: member.user_id,
        fullName: profile?.full_name ?? 'Anggota Keluarga',
        avatarUrl: profile?.avatar_url ?? null,
        role: member.role,
      };
    });
  },

  async listRoutines(familyId: string): Promise<RoutineDefinition[]> {
    if (FRONTEND_DEMO_MODE) {
      return demoRoutines.filter(item => item.familyId === familyId).map(item => ({...item, assigneeIds: [...item.assigneeIds]}));
    }

    const client = getSupabaseClient();
    const [{data: routines, error: routineError}, {data: assignments, error: assignmentError}] =
      await Promise.all([
        client.from('routine_definitions').select('*').eq('family_id', familyId).order('created_at', {ascending: true}),
        client.from('routine_assignments').select('routine_id, member_id').eq('family_id', familyId),
      ]);
    if (routineError) throw routineError;
    if (assignmentError) throw assignmentError;

    const assignmentRows = (assignments ?? []) as AssignmentRow[];
    return ((routines ?? []) as RoutineRow[]).map(row => toRoutine(row, assignmentRows));
  },

  async listSubmissions(familyId: string, startDate: string, endDate: string): Promise<RoutineSubmission[]> {
    if (FRONTEND_DEMO_MODE) {
      return demoSubmissions.filter(
        item => item.familyId === familyId && item.occurrenceDate >= startDate && item.occurrenceDate <= endDate,
      );
    }

    const {data, error} = await getSupabaseClient()
      .from('routine_submissions')
      .select('*')
      .eq('family_id', familyId)
      .gte('occurrence_date', startDate)
      .lte('occurrence_date', endDate)
      .order('submitted_at', {ascending: false});
    if (error) throw error;
    return Promise.all(((data ?? []) as SubmissionRow[]).map(toSubmission));
  },

  async saveRoutine(familyId: string, routineId: string | null, draft: RoutineDraft): Promise<string> {
    if (FRONTEND_DEMO_MODE) {
      const now = new Date().toISOString();
      const id = routineId ?? demoId('demo-routine');
      const current = demoRoutines.find(item => item.id === id);
      const next: RoutineDefinition = {
        id,
        familyId,
        createdBy: current?.createdBy ?? DEMO_USER_ID,
        title: draft.title.trim(),
        description: draft.description?.trim() || null,
        scheduleType: draft.scheduleType,
        weekdays: [...draft.weekdays],
        startDate: draft.startDate,
        endDate: draft.endDate ?? null,
        rewardPoints: draft.rewardPoints,
        proofRequired: draft.proofRequired,
        isActive: draft.isActive,
        assigneeIds: [...draft.assigneeIds],
        createdAt: current?.createdAt ?? now,
        updatedAt: now,
      };
      demoRoutines = [...demoRoutines.filter(item => item.id !== id), next];
      return id;
    }

    const {data, error} = await getSupabaseClient().rpc('save_family_routine', {
      p_routine_id: routineId,
      p_family_id: familyId,
      p_title: draft.title.trim(),
      p_description: draft.description?.trim() || null,
      p_schedule_type: draft.scheduleType,
      p_weekdays: draft.weekdays,
      p_start_date: draft.startDate,
      p_end_date: draft.endDate ?? null,
      p_reward_points: draft.rewardPoints,
      p_proof_required: draft.proofRequired,
      p_is_active: draft.isActive,
      p_assignee_ids: draft.assigneeIds,
    });
    if (error) throw error;
    if (typeof data !== 'string') throw new Error('INVALID_ROUTINE_RESPONSE');
    return data;
  },

  async removeRoutine(routineId: string): Promise<void> {
    if (FRONTEND_DEMO_MODE) {
      demoRoutines = demoRoutines.filter(item => item.id !== routineId);
      demoSubmissions = demoSubmissions.filter(item => item.routineId !== routineId);
      return;
    }
    const {error} = await getSupabaseClient().rpc('delete_family_routine', {p_routine_id: routineId});
    if (error) throw error;
  },

  async submitCompletion(input: {
    routineId: string;
    familyId: string;
    memberId: string;
    occurrenceDate: string;
    proofPath: string | null;
    proofMime: string | null;
    note: string | null;
  }): Promise<void> {
    if (FRONTEND_DEMO_MODE) {
      const existing = demoSubmissions.find(
        item =>
          item.routineId === input.routineId &&
          item.memberId === input.memberId &&
          item.occurrenceDate === input.occurrenceDate,
      );
      if (existing?.status === 'approved') throw new Error('ROUTINE_ALREADY_APPROVED');
      const now = new Date().toISOString();
      const next: RoutineSubmission = {
        id: existing?.id ?? demoId('demo-submission'),
        routineId: input.routineId,
        familyId: input.familyId,
        memberId: input.memberId,
        occurrenceDate: input.occurrenceDate,
        proofPath: input.proofPath,
        proofMime: input.proofMime,
        proofNote: input.note,
        proofUrl: null,
        status: 'pending',
        reviewNote: null,
        submittedAt: now,
        reviewedBy: null,
        reviewedAt: null,
        updatedAt: now,
      };
      demoSubmissions = [
        ...demoSubmissions.filter(item => item.id !== next.id),
        next,
      ];
      return;
    }

    const {error} = await getSupabaseClient().rpc('submit_routine_completion', {
      p_routine_id: input.routineId,
      p_occurrence_date: input.occurrenceDate,
      p_proof_path: input.proofPath,
      p_proof_mime: input.proofMime,
      p_note: input.note,
    });
    if (error) throw error;
  },

  async reviewSubmission(submissionId: string, reviewerId: string, decision: 'approved' | 'rejected', note: string | null): Promise<void> {
    if (FRONTEND_DEMO_MODE) {
      const submission = demoSubmissions.find(item => item.id === submissionId);
      if (!submission) throw new Error('ROUTINE_SUBMISSION_NOT_FOUND');
      if (submission.memberId === reviewerId) throw new Error('SELF_APPROVAL_NOT_ALLOWED');
      const now = new Date().toISOString();
      demoSubmissions = demoSubmissions.map(item =>
        item.id === submissionId
          ? {...item, status: decision, reviewNote: note, reviewedBy: reviewerId, reviewedAt: now, updatedAt: now}
          : item,
      );
      return;
    }

    const {error} = await getSupabaseClient().rpc('review_routine_submission', {
      p_submission_id: submissionId,
      p_decision: decision,
      p_note: note,
    });
    if (error) throw error;
  },

  subscribe(familyId: string, onChange: () => void): () => void {
    if (FRONTEND_DEMO_MODE) return () => undefined;

    const client = getSupabaseClient();
    const channel = client
      .channel(`routine-family-${familyId}`)
      .on('postgres_changes', {event: '*', schema: 'public', table: 'routine_definitions', filter: `family_id=eq.${familyId}`}, onChange)
      .on('postgres_changes', {event: '*', schema: 'public', table: 'routine_assignments', filter: `family_id=eq.${familyId}`}, onChange)
      .on('postgres_changes', {event: '*', schema: 'public', table: 'routine_submissions', filter: `family_id=eq.${familyId}`}, onChange)
      .subscribe();

    return () => {
      client.removeChannel(channel).catch(() => undefined);
    };
  },
};
