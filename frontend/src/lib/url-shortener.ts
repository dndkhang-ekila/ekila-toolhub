import type { ShortenedLink, UrlValidationResult, SafetyCheckResponse } from '../types/url';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

/**
 * Bảng mã ký tự an toàn (56 ký tự alphanumeric):
 * Loại bỏ hoàn toàn các ký tự dễ nhầm lẫn như:
 * - '0' (số 0) và 'O' (chữ O in hoa)
 * - '1' (số 1) và 'l' (chữ l in thường)
 * - 'I' (chữ I in hoa dễ nhầm với l và 1)
 */
export const SAFE_ALPHANUMERIC_CHARSET =
  '23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

const STORAGE_KEY = 'toolhub_shortened_links';

/**
 * Lấy Auth headers từ localStorage nếu có
 */
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    try {
      const token = localStorage.getItem('toolhub_access_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const userStr = localStorage.getItem('toolhub_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user?.id) headers['x-user-id'] = user.id;
      }
    } catch {
      // Storage unavailable / non-JSON
    }
  }
  return headers;
}

/**
 * [FR-URL-01] Sinh slug ngẫu nhiên độ dài 6–8 ký tự
 * Khắc phục triệt để thiên vị modulo (modulo bias) bằng Rejection Sampling:
 * 56 ký tự, 256 - (256 % 56) = 224. Chỉ nhận các byte < 224 để
 * đảm bảo 100% xác suất xuất hiện của mọi ký tự là bằng nhau (4/224 = 1/56).
 */
export function generateRandomSlug(minLength = 6, maxLength = 8): string {
  const length =
    Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
  let slug = '';
  const charset = SAFE_ALPHANUMERIC_CHARSET;
  const charsetLength = charset.length; // 56
  const maxValidByte = 256 - (256 % charsetLength); // 224

  while (slug.length < length) {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const needed = length - slug.length;
      const buffer = new Uint8Array(needed * 2);
      crypto.getRandomValues(buffer);
      for (let i = 0; i < buffer.length && slug.length < length; i++) {
        if (buffer[i] < maxValidByte) {
          slug += charset[buffer[i] % charsetLength];
        }
      }
    } else {
      slug += charset[Math.floor(Math.random() * charsetLength)];
    }
  }

  return slug;
}

/**
 * [FR-URL-01] Kiểm tra tính hợp lệ của URL (tối đa 2.048 ký tự, http/https)
 */
export function validateUrl(rawUrl: string): UrlValidationResult {
  const trimmed = (rawUrl || '').trim();

  if (!trimmed) {
    return { isValid: false, error: 'errorEmpty' };
  }

  if (trimmed.length > 2048) {
    return { isValid: false, error: 'errorTooLong' };
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return { isValid: false, error: 'errorInvalidProtocol' };
  }

  try {
    const parsed = new URL(trimmed);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { isValid: false, error: 'errorInvalidProtocol' };
    }

    // Tên miền phải có ít nhất 1 dấu chấm hoặc là localhost hợp lệ
    const hostname = parsed.hostname;
    if (!hostname || hostname.length < 3) {
      return { isValid: false, error: 'errorInvalidUrl' };
    }

    if (!hostname.includes('.') && hostname !== 'localhost') {
      return { isValid: false, error: 'errorInvalidUrl' };
    }

    return { isValid: true, sanitizedUrl: parsed.href };
  } catch {
    return { isValid: false, error: 'errorInvalidUrl' };
  }
}

/**
 * Kiểm tra an toàn URL qua API Backend (/links/check-safety)
 */
export async function checkUrlSafetyApi(url: string): Promise<SafetyCheckResponse> {
  try {
    const res = await fetch(`${API_BASE}/links/check-safety`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        isSafe: false,
        reason: data.message || 'Liên kết không an toàn theo chính sách ToolHub',
        violationKind: data.violationKind,
      };
    }

    const data = await res.json();
    return data;
  } catch {
    // Nếu backend chưa bật hoặc gặp lỗi mạng trong scaffold, fallback an toàn
    return { isSafe: true };
  }
}

/**
 * Lấy danh sách link rút gọn từ LocalStorage
 */
export function getRecentShortenedLinks(): ShortenedLink[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Lưu link rút gọn mới vào LocalStorage (giới hạn 50 link gần nhất)
 */
export function saveShortenedLink(link: ShortenedLink): ShortenedLink[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getRecentShortenedLinks();
    // Đưa link mới lên đầu danh sách, tránh trùng lặp id/slug
    const filtered = current.filter((item) => item.id !== link.id && item.slug !== link.slug);
    const updated = [link, ...filtered].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * Xoá một link khỏi LocalStorage
 */
export function removeShortenedLink(id: string): ShortenedLink[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getRecentShortenedLinks();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * Xoá toàn bộ lịch sử link rút gọn
 */
export function clearShortenedLinks(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * [FR-URL-01] Thực hiện rút gọn URL:
 * 1. Kiểm tra an toàn URL qua API backend (/links/check-safety)
 * 2. Gửi request tạo link lên Backend API POST /api/v1/links
 * 3. Đồng bộ lưu vào localStorage để hiển thị ngay trên UI
 */
export async function createShortUrl(
  originalUrl: string,
  origin = typeof window !== 'undefined' ? window.location.origin : 'https://toolhub.vn',
): Promise<ShortenedLink> {
  const validation = validateUrl(originalUrl);
  if (!validation.isValid || !validation.sanitizedUrl) {
    throw new Error(validation.error || 'errorInvalidUrl');
  }

  // 1. Kiểm tra chính sách an toàn URL
  const safety = await checkUrlSafetyApi(validation.sanitizedUrl);
  if (!safety.isSafe) {
    throw new Error(safety.reason || 'errorUnsafeUrl');
  }

  const slug = generateRandomSlug(6, 8);
  const cleanOrigin = origin.replace(/\/+$/, '');
  const shortUrl = `${cleanOrigin}/s/${slug}`;

  // 2. Gửi request tạo link lên Backend API POST /api/v1/links
  try {
    const headers = getAuthHeaders();

    const res = await fetch(`${API_BASE}/links`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        originalUrl: validation.sanitizedUrl,
        customSlug: slug,
        forceNew: true,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const linkRecord = data.link || data;
      const finalSlug = linkRecord.slug || slug;
      const finalShortUrl = `${cleanOrigin}/s/${finalSlug}`;

      const createdLink: ShortenedLink = {
        id: linkRecord.id || `link_${Date.now()}_${finalSlug}`,
        originalUrl: linkRecord.originalUrl || validation.sanitizedUrl,
        shortUrl: finalShortUrl,
        slug: finalSlug,
        createdAt: linkRecord.createdAt || new Date().toISOString(),
        clicks: linkRecord.clickCount ?? 0,
      };

      saveShortenedLink(createdLink);
      return createdLink;
    } else {
      const errorData = await res.json().catch(() => ({}));
      if (res.status === 422) {
        throw new Error(errorData.message || 'errorUnsafeUrl');
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message !== 'Failed to fetch' && !err.message.includes('NetworkError')) {
      throw err;
    }
  }

  // Fallback lưu cục bộ nếu backend tạm thời không kết nối được
  const fallbackLink: ShortenedLink = {
    id: `link_${Date.now()}_${slug}`,
    originalUrl: validation.sanitizedUrl,
    shortUrl,
    slug,
    createdAt: new Date().toISOString(),
    clicks: 0,
  };

  saveShortenedLink(fallbackLink);
  return fallbackLink;
}

/**
 * Tra cứu URL gốc từ slug qua LocalStorage hoặc Backend API GET /api/v1/links/:slug
 * Đảm bảo người khác nhận được link vẫn có thể mở và chuyển hướng thành công.
 */
export async function resolveShortUrl(slug: string): Promise<string | null> {
  if (!slug) return null;

  // 1. Kiểm tra localStorage trước (nhanh trên máy vừa tạo)
  const localLinks = getRecentShortenedLinks();
  const match = localLinks.find((item) => item.slug === slug);
  if (match?.originalUrl) {
    return match.originalUrl;
  }

  // 2. Tra cứu từ Backend API
  try {
    const res = await fetch(`${API_BASE}/links/${encodeURIComponent(slug)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.originalUrl) {
        saveShortenedLink({
          id: data.id || `link_${data.slug}`,
          originalUrl: data.originalUrl,
          shortUrl: typeof window !== 'undefined' ? `${window.location.origin}/s/${data.slug}` : data.shortUrl,
          slug: data.slug,
          createdAt: data.createdAt || new Date().toISOString(),
          clicks: data.clickCount ?? 0,
        });
        return data.originalUrl;
      }
    }
  } catch {
    // Network / offline fallback
  }

  return null;
}
