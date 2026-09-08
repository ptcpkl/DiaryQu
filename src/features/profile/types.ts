export interface UserProfile {
  id: string;
  email: string | null;
  fullName: string;
  avatarUrl: string | null;
  phoneNumber: string | null;
}

export interface UserProfileDraft {
  fullName: string;
  phoneNumber: string | null;
}
