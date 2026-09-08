import {
  normalizePhoneNumber,
  validateProfileDraft,
} from '../src/features/profile/utils/profile';

describe('profile helpers', () => {
  it('normalizes optional phone number whitespace', () => {
    expect(normalizePhoneNumber('  +62   812  3456  ')).toBe('+62 812 3456');
    expect(normalizePhoneNumber('   ')).toBeNull();
  });

  it('requires a valid display name', () => {
    expect(validateProfileDraft({fullName: ' ', phoneNumber: null})).toBe(
      'Nama lengkap wajib diisi.',
    );
    expect(validateProfileDraft({fullName: 'Pak Dahlan', phoneNumber: null})).toBeNull();
  });

  it('rejects malformed phone values', () => {
    expect(
      validateProfileDraft({fullName: 'Pak Dahlan', phoneNumber: '12'}),
    ).toContain('6–24');
    expect(
      validateProfileDraft({fullName: 'Pak Dahlan', phoneNumber: '+62 abc'}),
    ).toContain('hanya boleh');
  });
});
