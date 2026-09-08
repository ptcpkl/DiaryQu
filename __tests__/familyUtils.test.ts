import type {FamilyMember} from '../src/features/family/types';
import {
  formatJoinedDate,
  sortFamilyMembers,
  validateFamilyName,
} from '../src/features/family/utils/family';

const members: FamilyMember[] = [
  {
    id: 'member-late',
    fullName: 'Budi',
    avatarUrl: null,
    phoneNumber: null,
    role: 'member',
    joinedAt: '2026-09-03T00:00:00.000Z',
  },
  {
    id: 'head',
    fullName: 'Pak Dahlan',
    avatarUrl: null,
    phoneNumber: null,
    role: 'head',
    joinedAt: '2026-09-02T00:00:00.000Z',
  },
  {
    id: 'member-early',
    fullName: 'Bu Rina',
    avatarUrl: null,
    phoneNumber: null,
    role: 'member',
    joinedAt: '2026-09-01T00:00:00.000Z',
  },
];

describe('Family Room helpers', () => {
  it('keeps Head first and then sorts members by joined time', () => {
    expect(sortFamilyMembers(members).map(item => item.id)).toEqual([
      'head',
      'member-early',
      'member-late',
    ]);
  });

  it('validates Family Room names', () => {
    expect(validateFamilyName('A')).toContain('minimal');
    expect(validateFamilyName('Keluarga Pak Dahlan')).toBeNull();
  });

  it('formats joined date safely', () => {
    expect(formatJoinedDate('2026-09-01T00:00:00.000Z')).toContain('Bergabung');
    expect(formatJoinedDate('invalid')).toBe('Tanggal bergabung tidak tersedia');
  });
});
