import type {FamilyMember} from '../types';

export function validateFamilyName(value: string): string | null {
  const name = value.trim();
  if (name.length < 2) return 'Nama keluarga minimal 2 karakter.';
  if (name.length > 100) return 'Nama keluarga maksimal 100 karakter.';
  return null;
}

export function sortFamilyMembers(members: FamilyMember[]): FamilyMember[] {
  return [...members].sort((a, b) => {
    if (a.role !== b.role) return a.role === 'head' ? -1 : 1;
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });
}

export function formatJoinedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tanggal bergabung tidak tersedia';
  return `Bergabung ${new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)}`;
}
