export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface PasswordStrength {
  score: number; // 0 - 4
  label: 'Quá yếu' | 'Yếu' | 'Trung bình' | 'Mạnh' | 'Rất mạnh';
  color: string;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

/**
 * Kiểm tra định dạng Email theo chuẩn RFC 5322 cơ bản
 */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Vui lòng nhập địa chỉ email.' };
  }

  // Regex kiểm tra email chuẩn
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Địa chỉ email không đúng định dạng.' };
  }

  if (trimmed.length > 254) {
    return { isValid: false, error: 'Địa chỉ email không được vượt quá 254 ký tự.' };
  }

  return { isValid: true };
}

/**
 * Đánh giá độ mạnh mật khẩu và kiểm tra các tiêu chí bảo mật theo NFR-SEC-02/03
 */
export function evaluatePasswordStrength(password: string): PasswordStrength {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
  };

  const satisfiedCount = Object.values(requirements).filter(Boolean).length;

  let score = 0;
  let label: PasswordStrength['label'] = 'Quá yếu';
  let color = 'bg-red-500';

  if (!password) {
    score = 0;
    label = 'Quá yếu';
    color = 'bg-zinc-300 dark:bg-zinc-700';
  } else if (password.length < 8 || satisfiedCount <= 2) {
    score = 1;
    label = 'Yếu';
    color = 'bg-red-500';
  } else if (satisfiedCount === 3) {
    score = 2;
    label = 'Trung bình';
    color = 'bg-amber-500';
  } else if (satisfiedCount === 4) {
    score = 3;
    label = 'Mạnh';
    color = 'bg-blue-500';
  } else {
    score = 4;
    label = 'Rất mạnh';
    color = 'bg-emerald-500';
  }

  return {
    score,
    label,
    color,
    requirements,
  };
}

/**
 * Kiểm tra tính hợp lệ của mật khẩu khi đăng ký
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Vui lòng nhập mật khẩu.' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Mật khẩu phải chứa ít nhất 8 ký tự.' };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Mật khẩu không được vượt quá 128 ký tự.' };
  }

  const { requirements } = evaluatePasswordStrength(password);
  if (!requirements.hasUppercase || !requirements.hasLowercase) {
    return { isValid: false, error: 'Mật khẩu phải chứa cả chữ hoa và chữ thường.' };
  }

  if (!requirements.hasNumber) {
    return { isValid: false, error: 'Mật khẩu phải chứa ít nhất 1 chữ số.' };
  }

  if (!requirements.hasSpecialChar) {
    return { isValid: false, error: 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (ví dụ: !@#$%^&*).' };
  }

  return { isValid: true };
}

/**
 * Kiểm tra xác nhận mật khẩu
 */
export function validateConfirmPassword(password: string, confirmPassword: string): ValidationResult {
  if (!confirmPassword) {
    return { isValid: false, error: 'Vui lòng nhập lại mật khẩu xác nhận.' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Mật khẩu xác nhận không khớp.' };
  }

  return { isValid: true };
}

/**
 * Kiểm tra mã OTP xác minh email (6 chữ số)
 */
export function validateVerificationCode(code: string): ValidationResult {
  const trimmed = code.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Vui lòng nhập mã xác minh.' };
  }

  if (!/^\d{6}$/.test(trimmed)) {
    return { isValid: false, error: 'Mã xác minh phải gồm đúng 6 chữ số.' };
  }

  return { isValid: true };
}
