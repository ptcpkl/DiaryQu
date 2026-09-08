import {validateLogin, validateRegister} from '../src/features/auth/utils/validation';

describe('auth validation', () => {
  it('validates login email and password', () => {
    expect(validateLogin('', '')).toEqual({
      email: 'Email wajib diisi.',
      password: 'Password wajib diisi.',
    });
    expect(validateLogin('user@diaryqu.id', 'secret')).toEqual({});
  });

  it('requires a strong enough registration password and matching confirmation', () => {
    expect(validateRegister('A', 'bad-email', '123', '321')).toEqual({
      fullName: 'Nama lengkap minimal 2 karakter.',
      email: 'Format email belum valid.',
      password: 'Password minimal 8 karakter.',
      confirmPassword: 'Konfirmasi password belum sama.',
    });
  });

  it('accepts a valid registration payload', () => {
    expect(
      validateRegister(
        'Pak Dahlan',
        'pak.dahlan@example.com',
        'aman-sekali',
        'aman-sekali',
      ),
    ).toEqual({});
  });
});
