export type FamilyRole = 'head' | 'member';

export interface FamilySummary {
  id: string;
  name: string;
  familyCode: string;
  role: FamilyRole;
}

export type FamilyLoadStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';
