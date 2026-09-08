import type {SharedFamilyLocation, TrackingMember} from '../src/features/tracking/types';
import {
  formatApproximateCoordinate,
  formatLocationAge,
  getLocationFreshness,
  mergeMembersWithLocations,
  relativeMapPosition,
} from '../src/features/tracking/utils/tracking';

const baseLocation: SharedFamilyLocation = {
  familyId: 'family-1',
  userId: 'user-1',
  latitude: -6.2,
  longitude: 106.8,
  accuracyMeters: 15,
  provider: 'gps',
  sharingEnabled: true,
  recordedAt: '2026-09-08T06:58:00.000Z',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-08T06:58:00.000Z',
};

const members: TrackingMember[] = [
  {id: 'user-1', fullName: 'Pak Dahlan', avatarUrl: null, role: 'head'},
  {id: 'user-2', fullName: 'Alya', avatarUrl: null, role: 'member'},
];

describe('tracking utils', () => {
  it('merges visible location rows onto family members', () => {
    const merged = mergeMembersWithLocations(members, [baseLocation]);
    expect(merged[0].location?.latitude).toBe(-6.2);
    expect(merged[1].location).toBeNull();
  });

  it('classifies freshness without treating hidden locations as live', () => {
    const now = new Date('2026-09-08T07:00:00.000Z');
    expect(getLocationFreshness(baseLocation, now)).toBe('live');
    expect(
      getLocationFreshness(
        {...baseLocation, recordedAt: '2026-09-08T06:30:00.000Z'},
        now,
      ),
    ).toBe('recent');
    expect(
      getLocationFreshness(
        {...baseLocation, recordedAt: '2026-09-08T04:00:00.000Z'},
        now,
      ),
    ).toBe('stale');
    expect(
      getLocationFreshness({...baseLocation, sharingEnabled: false}, now),
    ).toBe('hidden');
  });

  it('formats age and coordinate precision for the UI', () => {
    const now = new Date('2026-09-08T07:10:00.000Z');
    expect(formatLocationAge(baseLocation, now)).toBe('12 menit lalu');
    expect(formatApproximateCoordinate(106.812345)).toBe('106.8123');
    expect(formatApproximateCoordinate(null)).toBe('-');
  });

  it('keeps relative map positions inside the visual canvas', () => {
    const center = relativeMapPosition(-6.2, 106.8, -6.2, 106.8);
    expect(center).toEqual({leftPercent: 50, topPercent: 50});

    const far = relativeMapPosition(-10, 120, -6.2, 106.8);
    expect(far.leftPercent).toBeLessThanOrEqual(88);
    expect(far.leftPercent).toBeGreaterThanOrEqual(12);
    expect(far.topPercent).toBeLessThanOrEqual(88);
    expect(far.topPercent).toBeGreaterThanOrEqual(12);
  });
});
