export interface LoginValidationResult {
  email?: string;
  password?: string;
}

export interface RegisterValidationResult extends LoginValidationResult {
  fullName?: string;
  confirmPassword?: string;
}

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export function validateLogin(
  email: string,
  password: string,
): LoginValidationResult {
  const errors: LoginValidationResult = {};
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    errors.email = 'Email wajib diisi.';
  } else if (!EMAIL_PATTERN.test(normalizedEmail)) {
    errors.email = 'Format email belum valid.';
  }

  if (!password) {
    errors.password = 'Password wajib diisi.';
  }

  return errors;
}

export function validateRegister(
  fullName: string,
  email: string,
  password: string,
  confirmPassword: string,
): RegisterValidationResult {
  const errors: RegisterValidationResult = validateLogin(email, password);

  if (fullName.trim().length < 2) {
    errors.fullName = 'Nama lengkap minimal 2 karakter.';
  } else if (fullName.trim().length > 80) {
    errors.fullName = 'Nama lengkap maksimal 80 karakter.';
  }

  if (password && password.length < 8) {
    errors.password = 'Password minimal 8 karakter.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Konfirmasi password wajib diisi.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Konfirmasi password belum sama.';
  }

  return errors;
}
