export type FamilyRole = 'head' | 'member';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  phoneNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMembership {
  id: string;
  familyId: string;
  userId: string;
  role: FamilyRole;
  joinedAt: string;
}