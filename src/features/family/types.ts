export type FamilyRole = 'head' | 'member';

export interface FamilySummary {
  id: string;
  name: string;
  familyCode: string;
  role: FamilyRole;
}

export interface FamilyMember {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  phoneNumber: string | null;
  role: FamilyRole;
  joinedAt: string;
}

export type FamilyLoadStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';
export type FamilyMemberLoadStatus = 'idle' | 'loading' | 'ready' | 'error';
