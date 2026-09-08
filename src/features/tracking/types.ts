export type TrackingMemberRole = 'head' | 'member';

export interface TrackingMember {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  role: TrackingMemberRole;
}

export interface SharedFamilyLocation {
  familyId: string;
  userId: string;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  provider: string | null;
  sharingEnabled: boolean;
  recordedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingMemberLocation extends TrackingMember {
  location: SharedFamilyLocation | null;
}

export interface NativeLocationPosition {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  provider: string | null;
  recordedAt: string;
}

export interface LocationShareInput extends NativeLocationPosition {}

export type LocationFreshness = 'live' | 'recent' | 'stale' | 'hidden';
