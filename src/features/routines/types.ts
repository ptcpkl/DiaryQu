import type {FamilyRole} from '../family/types';

export type RoutineScheduleType = 'daily' | 'weekly';
export type RoutineSubmissionStatus = 'pending' | 'approved' | 'rejected';

export type RoutineMember = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  role: FamilyRole;
};

export type RoutineDefinition = {
  id: string;
  familyId: string;
  createdBy: string;
  title: string;
  description: string | null;
  scheduleType: RoutineScheduleType;
  weekdays: number[];
  startDate: string;
  endDate: string | null;
  rewardPoints: number;
  proofRequired: boolean;
  isActive: boolean;
  assigneeIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type RoutineSubmission = {
  id: string;
  routineId: string;
  familyId: string;
  memberId: string;
  occurrenceDate: string;
  proofPath: string | null;
  proofMime: string | null;
  proofNote: string | null;
  proofUrl: string | null;
  status: RoutineSubmissionStatus;
  reviewNote: string | null;
  submittedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  updatedAt: string;
};

export type RoutineDraft = {
  title: string;
  description?: string | null;
  scheduleType: RoutineScheduleType;
  weekdays: number[];
  startDate: string;
  endDate?: string | null;
  rewardPoints: number;
  proofRequired: boolean;
  isActive: boolean;
  assigneeIds: string[];
};

export type PickedRoutineProof = {
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  sizeBytes: number;
  base64: string;
};
