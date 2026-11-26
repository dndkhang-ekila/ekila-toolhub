import type { ProtectedLinkMeta, PasswordVerificationResult } from '@/types/protected-link';

const STORAGE_KEY = 'toolhub_protected_links';
const ATTEMPTS_KEY = 'toolhub_link_attempts_';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 giây tạm khóa khi nhập sai quá 5 lần

/**
 * Chuẩn hóa slug về dạng chữ thường không chứa khoảng trắng thừa
 */
export function normalizeSlug(slug: string): string {
  return (slug || '').trim().toLowerCase();
}

function extractSlugFromPath(path: string): string {
  const withoutQuery = path.split(/[?#]/)[0];
  const segments = withoutQuery.split('/').filter(Boolean);
  if (segments.length >= 2 && segments[0].toLowerCase() === 's') {
    return normalizeSlug(segments[1]);
  }
  if (segments.length >= 1) {
    return normalizeSlug(segments[segments.length - 1]);
  }
  return '';
}

/**
 * Trích xuất mã slug từ URL đầy đủ (vd: https://toolhub.vn/s/abc), đường dẫn (/s/abc, /abc) hoặc slug thuần
 */
export function extractSlugFromInput(input: string): string {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';

  const candidateUrl = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/|$)|^localhost(:\d+)?(\/|$)/i.test(trimmed)
    ? `https://${trimmed}`
    : trimmed;

  try {
    if (/^https?:\/\//i.test(candidateUrl)) {
      const parsed = new URL(candidateUrl);
      return extractSlugFromPath(parsed.pathname);
    }
  } catch {
    // Fallback sang xử lý chuỗi đường dẫn tương đối
  }

  return extractSlugFromPath(trimmed);
}

/**
 * Kiểm tra định dạng slug hợp lệ
 */
export function isValidSlugFormat(slug: string): boolean {
  return /^[a-z0-9_-]{1,100}$/.test(normalizeSlug(slug));
}

/**
 * Kiểm tra mật khẩu tối thiểu 4 ký tự và đối chiếu mật khẩu xác nhận
 */
export function validateLinkPasswordPair(
  password: string,
  confirmPassword?: string,
  requireConfirm = true,
): string | null {
  const trimmedPassword = (password || '').trim();
  if (trimmedPassword.length < 4) {
    return 'Mật khẩu bảo vệ phải có tối thiểu 4 ký tự.';
  }
  if (requireConfirm) {
    const trimmedConfirm = (confirmPassword || '').trim();
    if (!trimmedConfirm) {
      return 'Vui lòng nhập lại mật khẩu để xác nhận.';
    }
    if (trimmedPassword !== trimmedConfirm) {
      return 'Mật khẩu xác nhận không trùng khớp.';
    }
  }
  return null;
}

const PASSWORD_GEN_CHARSET =
  'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789@#$!';

/**
 * Sinh mật khẩu ngẫu nhiên an toàn (loại bỏ ký tự dễ nhầm và không modulo bias)
 */
export function generateStrongLinkPassword(length = 10): string {
  const safeLen = Math.max(6, Math.min(32, length));
  const charsetLen = PASSWORD_GEN_CHARSET.length;
  const maxValidByte = 256 - (256 % charsetLen);
  let out = '';

  while (out.length < safeLen) {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const buf = new Uint8Array((safeLen - out.length) * 2);
      crypto.getRandomValues(buf);
      for (let i = 0; i < buf.length && out.length < safeLen; i++) {
        if (buf[i] < maxValidByte) {
          out += PASSWORD_GEN_CHARSET[buf[i] % charsetLen];
        }
      }
    } else {
      out += PASSWORD_GEN_CHARSET[Math.floor(Math.random() * charsetLen)];
    }
  }
  return out;
}

/**
 * Hàm băm một chiều SHA-256 ở client
 */
export async function hashPasswordClient(password: string): Promise<string> {
  const normalized = password.trim();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const msgUint8 = new TextEncoder().encode(normalized + '_toolhub_salt');
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }
  // Fallback btoa nếu SubtleCrypto không khả dụng
  return btoa(unescape(encodeURIComponent(normalized)));
}

/**
 * Quản lý lưu trữ thông tin liên kết có mật khẩu phía client
 */
export const protectedLinkStorage = {
  getAll(): Record<string, ProtectedLinkMeta> {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  isProtected(slug: string): boolean {
    const cleanSlug = normalizeSlug(slug);
    if (!cleanSlug) return false;
    const all = this.getAll();
    return Boolean(all[cleanSlug]?.hasPassword);
  },

  getMeta(slug: string): ProtectedLinkMeta | null {
    const cleanSlug = normalizeSlug(slug);
    if (!cleanSlug) return null;
    const all = this.getAll();
    return all[cleanSlug] || null;
  },

  async setPassword(slug: string, password: string, originalUrl?: string): Promise<void> {
    const cleanSlug = normalizeSlug(slug);
    if (!cleanSlug || !password) return;
    const all = this.getAll();
    const hash = await hashPasswordClient(password);

    all[cleanSlug] = {
      slug: cleanSlug,
      hasPassword: true,
      passwordHash: hash,
      originalUrl: originalUrl || all[cleanSlug]?.originalUrl,
      updatedAt: Date.now(),
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      } catch {
        // Storage full or unavailable
      }
    }
  },

  removePassword(slug: string): void {
    const cleanSlug = normalizeSlug(slug);
    if (!cleanSlug) return;
    const all = this.getAll();
    if (all[cleanSlug]) {
      delete all[cleanSlug];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        } catch {
          // Ignore
        }
      }
    }
    this.resetAttempts(cleanSlug);
  },

  /**
   * Kiểm tra mật khẩu và quản lý giới hạn thử (Anti-brute-force)
   */
  async verifyPassword(slug: string, password: string): Promise<PasswordVerificationResult> {
    const cleanSlug = normalizeSlug(slug);
    const meta = this.getMeta(cleanSlug);

    // Kiểm tra trạng thái tạm khóa (Lockout)
    const attemptsData = this.getAttemptsData(cleanSlug);
    const now = Date.now();

    if (attemptsData.lockedUntil && now < attemptsData.lockedUntil) {
      const waitSeconds = Math.ceil((attemptsData.lockedUntil - now) / 1000);
      return {
        success: false,
        message: `Bạn đã nhập sai quá nhiều lần. Vui lòng chờ ${waitSeconds} giây để thử lại.`,
        lockedUntil: attemptsData.lockedUntil,
      };
    }

    if (!meta || !meta.hasPassword) {
      return { success: true, originalUrl: meta?.originalUrl };
    }

    const inputHash = await hashPasswordClient(password);

    if (inputHash === meta.passwordHash) {
      // Đăng nhập thành công -> Reset số lần thử
      this.resetAttempts(cleanSlug);
      return {
        success: true,
        originalUrl: meta.originalUrl,
      };
    }

    // Nhập sai -> Ghi nhận và tăng số lần thử
    const newCount = (attemptsData.count || 0) + 1;
    const remaining = Math.max(0, MAX_ATTEMPTS - newCount);

    if (newCount >= MAX_ATTEMPTS) {
      const lockedUntil = now + LOCKOUT_DURATION_MS;
      this.saveAttemptsData(cleanSlug, { count: newCount, lockedUntil });
      return {
        success: false,
        message: 'Bạn đã nhập sai 5 lần. Tạm khóa nhập mật khẩu trong 30 giây.',
        remainingAttempts: 0,
        lockedUntil,
      };
    }

    this.saveAttemptsData(cleanSlug, { count: newCount });
    return {
      success: false,
      message: `Mật khẩu không chính xác. Bạn còn ${remaining} lần thử.`,
      remainingAttempts: remaining,
    };
  },

  getAttemptsData(slug: string): { count: number; lockedUntil?: number } {
    if (typeof window === 'undefined') return { count: 0 };
    const cleanSlug = normalizeSlug(slug);
    if (!cleanSlug) return { count: 0 };
    try {
      const raw = localStorage.getItem(`${ATTEMPTS_KEY}${cleanSlug}`);
      return raw ? JSON.parse(raw) : { count: 0 };
    } catch {
      return { count: 0 };
    }
  },

  saveAttemptsData(slug: string, data: { count: number; lockedUntil?: number }): void {
    if (typeof window === 'undefined') return;
    const cleanSlug = normalizeSlug(slug);
    if (!cleanSlug) return;
    try {
      localStorage.setItem(`${ATTEMPTS_KEY}${cleanSlug}`, JSON.stringify(data));
    } catch {
      // Ignore
    }
  },

  resetAttempts(slug: string): void {
    if (typeof window === 'undefined') return;
    const cleanSlug = normalizeSlug(slug);
    if (!cleanSlug) return;
    try {
      localStorage.removeItem(`${ATTEMPTS_KEY}${cleanSlug}`);
    } catch {
      // Ignore
    }
  },
};
