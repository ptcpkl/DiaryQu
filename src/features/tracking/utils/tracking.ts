import type {
  LocationFreshness,
  SharedFamilyLocation,
  TrackingMember,
  TrackingMemberLocation,
} from '../types';

const LIVE_WINDOW_MS = 5 * 60 * 1000;
const RECENT_WINDOW_MS = 60 * 60 * 1000;

export function mergeMembersWithLocations(
  members: TrackingMember[],
  locations: SharedFamilyLocation[],
): TrackingMemberLocation[] {
  const locationMap = new Map(locations.map(location => [location.userId, location]));
  return members.map(member => ({
    ...member,
    location: locationMap.get(member.id) ?? null,
  }));
}

export function getLocationFreshness(
  location: SharedFamilyLocation | null,
  now = new Date(),
): LocationFreshness {
  if (!location?.sharingEnabled || !location.recordedAt) return 'hidden';
  const recordedAt = new Date(location.recordedAt).getTime();
  if (!Number.isFinite(recordedAt)) return 'stale';
  const age = Math.max(0, now.getTime() - recordedAt);
  if (age <= LIVE_WINDOW_MS) return 'live';
  if (age <= RECENT_WINDOW_MS) return 'recent';
  return 'stale';
}

export function formatLocationAge(
  location: SharedFamilyLocation | null,
  now = new Date(),
): string {
  if (!location?.sharingEnabled || !location.recordedAt) return 'Lokasi tidak dibagikan';
  const recordedAt = new Date(location.recordedAt).getTime();
  if (!Number.isFinite(recordedAt)) return 'Waktu lokasi tidak diketahui';
  const ageMs = Math.max(0, now.getTime() - recordedAt);
  const minutes = Math.floor(ageMs / 60_000);
  if (minutes < 1) return 'Baru saja diperbarui';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export function formatApproximateCoordinate(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '-';
  return value.toFixed(4);
}

export function clampMapOffset(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-1, Math.min(1, value));
}

export function relativeMapPosition(
  latitude: number,
  longitude: number,
  centerLatitude: number,
  centerLongitude: number,
) {
  const latitudeSpan = 0.025;
  const longitudeSpan = 0.025;
  const x = clampMapOffset((longitude - centerLongitude) / longitudeSpan);
  const y = clampMapOffset((centerLatitude - latitude) / latitudeSpan);
  return {
    leftPercent: 50 + x * 38,
    topPercent: 50 + y * 38,
  };
}
