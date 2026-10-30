import type { ShortenedLink, UrlValidationResult } from '../types/url';

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
 * [FR-URL-01] Sinh slug ngẫu nhiên độ dài 6–8 ký tự
 */
export function generateRandomSlug(minLength = 6, maxLength = 8): string {
  const length =
    Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
  let slug = '';
  const charset = SAFE_ALPHANUMERIC_CHARSET;
  const charsetLength = charset.length;

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomBytes = new Uint8Array(length);
    crypto.getRandomValues(randomBytes);
    for (let i = 0; i < length; i++) {
      slug += charset[randomBytes[i] % charsetLength];
    }
  } else {
    for (let i = 0; i < length; i++) {
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
    // Đưa link mới lên đầu danh sách, tránh trùng lặp id
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
 * Phản hồi trong thời gian dưới 1 giây (đạt tiêu chí nghiệm thu)
 */
export async function createShortUrl(
  originalUrl: string,
  origin = typeof window !== 'undefined' ? window.location.origin : 'https://toolhub.vn',
): Promise<ShortenedLink> {
  const validation = validateUrl(originalUrl);
  if (!validation.isValid || !validation.sanitizedUrl) {
    throw new Error(validation.error || 'errorInvalidUrl');
  }

  const slug = generateRandomSlug(6, 8);
  const cleanOrigin = origin.replace(/\/+$/, '');
  const shortUrl = `${cleanOrigin}/s/${slug}`;

  const newLink: ShortenedLink = {
    id: `link_${Date.now()}_${slug}`,
    originalUrl: validation.sanitizedUrl,
    shortUrl,
    slug,
    createdAt: new Date().toISOString(),
    clicks: 0,
  };

  // Lưu ngay vào localStorage
  saveShortenedLink(newLink);

  // TODO: [FR-URL-01][BE] Khi Backend có API POST /api/v1/urls/shorten, đồng bộ bất đồng bộ
  return newLink;
}
