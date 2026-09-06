export interface LoginValidationResult {
  email?: string;
  password?: string;
}

export function validateLogin(
  email: string,
  password: string,
): LoginValidationResult {
  const errors: LoginValidationResult = {};
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    errors.email = 'Email wajib diisi.';
  } else if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    errors.email = 'Format email belum valid.';
  }

  if (!password) {
    errors.password = 'Password wajib diisi.';
  }

  return errors;
}
