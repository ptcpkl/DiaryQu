import type {UserProfileDraft} from '../types';

export function normalizePhoneNumber(value: string): string | null {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized || null;
}

export function validateProfileDraft(draft: UserProfileDraft): string | null {
  const name = draft.fullName.trim();
  if (!name) return 'Nama lengkap wajib diisi.';
  if (name.length > 100) return 'Nama lengkap maksimal 100 karakter.';

  const phone = draft.phoneNumber?.trim() ?? '';
  if (!phone) return null;
  if (phone.length < 6 || phone.length > 24) {
    return 'Nomor telepon harus terdiri dari 6–24 karakter.';
  }
  if (!/^\+?[0-9 ()-]+$/.test(phone)) {
    return 'Nomor telepon hanya boleh berisi angka, spasi, +, -, dan tanda kurung.';
  }

  return null;
}
