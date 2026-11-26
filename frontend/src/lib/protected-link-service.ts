import type { LinkItem } from '@/types/link';
import {
  checkUrlSafetyApi,
  generateRandomSlug,
  getRecentShortenedLinks,
  resolveShortUrl,
  saveShortenedLink,
  validateUrl,
} from '@/lib/url-shortener';
import { createShortLink, fetchLinks, resolveSlug } from '@/lib/link-api';
import {
  extractSlugFromInput,
  isValidSlugFormat,
  normalizeSlug,
  protectedLinkStorage,
} from '@/lib/protected-link-storage';

export interface AvailableShortLink {
  slug: string;
  originalUrl: string;
  shortUrl: string;
  isProtected: boolean;
  source: 'backend' | 'local';
}

export interface LookupLinkResult {
  exists: boolean;
  originalUrl: string | null;
}

export interface CreateProtectedLinkInput {
  slugInput: string;
  originalUrlInput: string;
  password: string;
  origin?: string;
}

export interface CreateProtectedLinkResult {
  slug: string;
  shortUrl: string;
  originalUrl?: string;
  isUpdated: boolean;
  isReusedDuplicate?: boolean;
}

export interface UnlockResolutionResult {
  status: 'SUCCESS' | 'DISABLED' | 'EXPIRED' | 'NO_TARGET';
  targetUrl: string | null;
}

/**
 * Lấy danh sách liên kết rút gọn hiện có từ trình duyệt và backend (nếu khả dụng)
 * để người dùng chọn gắn mật khẩu nhanh.
 */
export async function listAvailableShortLinks(): Promise<AvailableShortLink[]> {
  const bySlug = new Map<string, AvailableShortLink>();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  for (const item of getRecentShortenedLinks()) {
    const cleanSlug = normalizeSlug(item.slug);
    if (!cleanSlug) continue;
    bySlug.set(cleanSlug, {
      slug: cleanSlug,
      originalUrl: item.originalUrl,
      shortUrl: item.shortUrl || (origin ? `${origin}/s/${cleanSlug}` : `/s/${cleanSlug}`),
      isProtected: protectedLinkStorage.isProtected(cleanSlug),
      source: 'local',
    });
  }

  try {
    const remoteLinks = await fetchLinks();
    for (const item of remoteLinks) {
      const cleanSlug = normalizeSlug(item.slug);
      if (!cleanSlug) continue;
      bySlug.set(cleanSlug, {
        slug: cleanSlug,
        originalUrl: item.originalUrl,
        shortUrl: origin ? `${origin}/s/${cleanSlug}` : `/s/${cleanSlug}`,
        isProtected: protectedLinkStorage.isProtected(cleanSlug),
        source: 'backend',
      });
    }
  } catch {
    // Backend chưa bật hoặc chưa đăng nhập -> dùng danh sách localStorage
  }

  return Array.from(bySlug.values());
}

/**
 * Tra cứu thông tin liên kết trước khi mở khóa mà KHÔNG ghi nhận lượt click (BR-URL-03).
 */
export async function lookupLinkWithoutTracking(slug: string): Promise<LookupLinkResult> {
  const cleanSlug = normalizeSlug(slug);
  if (!cleanSlug) {
    return { exists: false, originalUrl: null };
  }

  const protectedMeta = protectedLinkStorage.getMeta(cleanSlug);
  if (protectedMeta?.originalUrl) {
    return { exists: true, originalUrl: protectedMeta.originalUrl };
  }

  const localMatch = getRecentShortenedLinks().find(
    (item) => normalizeSlug(item.slug) === cleanSlug,
  );
  if (localMatch?.originalUrl) {
    return { exists: true, originalUrl: localMatch.originalUrl };
  }

  const remoteUrl = await resolveShortUrl(cleanSlug).catch(() => null);
  if (remoteUrl) {
    return { exists: true, originalUrl: remoteUrl };
  }

  return {
    exists: Boolean(protectedMeta?.hasPassword),
    originalUrl: null,
  };
}

/**
 * Ghi nhận lượt truy cập sau khi mật khẩu đã được xác thực thành công (BR-URL-03)
 * và tôn trọng trạng thái vô hiệu hóa / hết hạn (BR-URL-01).
 */
export async function trackUnlockAndResolveTarget(
  slug: string,
  fallbackUrl?: string | null,
): Promise<UnlockResolutionResult> {
  const cleanSlug = normalizeSlug(slug);
  if (!cleanSlug) {
    return fallbackUrl
      ? { status: 'SUCCESS', targetUrl: fallbackUrl }
      : { status: 'NO_TARGET', targetUrl: null };
  }

  try {
    const res = await resolveSlug(cleanSlug);
    if (res.status === 'SUCCESS' && res.originalUrl) {
      return { status: 'SUCCESS', targetUrl: res.originalUrl };
    }
    if (res.status === 'DISABLED' || res.status === 'EXPIRED') {
      return { status: res.status, targetUrl: null };
    }
  } catch {
    // Backend offline hoặc slug chỉ lưu cục bộ
  }

  if (fallbackUrl) {
    return { status: 'SUCCESS', targetUrl: fallbackUrl };
  }

  const lookedUp = await lookupLinkWithoutTracking(cleanSlug);
  if (lookedUp.originalUrl) {
    return { status: 'SUCCESS', targetUrl: lookedUp.originalUrl };
  }

  return { status: 'NO_TARGET', targetUrl: null };
}

/**
 * Tạo hoặc cập nhật mật khẩu bảo vệ cho liên kết thực tế:
 * - Kiểm tra hợp lệ + chính sách an toàn URL khi có URL gốc.
 * - Tương thích cấu trúc CreateLinkResult ({ link, isDuplicate }) từ backend LinksController.
 * - Tuân thủ BR-URL-01..03 (lưu ngắn đồng bộ, tái sử dụng hoặc cập nhật slug).
 */
export async function protectShortLink({
  slugInput,
  originalUrlInput,
  password,
  origin = typeof window !== 'undefined' ? window.location.origin : '',
}: CreateProtectedLinkInput): Promise<CreateProtectedLinkResult> {
  const trimmedUrl = originalUrlInput.trim();
  const parsedSlug = extractSlugFromInput(slugInput);

  if (slugInput.trim() && (!parsedSlug || !isValidSlugFormat(parsedSlug))) {
    throw new Error('Mã slug không hợp lệ (chỉ dùng chữ cái, số, dấu "-" hoặc "_").');
  }

  if (parsedSlug && (parsedSlug.length < 3 || parsedSlug.length > 32)) {
    throw new Error('Mã slug phải có độ dài từ 3 đến 32 ký tự.');
  }

  if (!parsedSlug && !trimmedUrl) {
    throw new Error('Vui lòng nhập đường dẫn URL gốc hoặc mã slug của liên kết.');
  }

  let sanitizedUrl: string | undefined;
  if (trimmedUrl) {
    const validation = validateUrl(trimmedUrl);
    if (!validation.isValid || !validation.sanitizedUrl) {
      if (validation.error === 'errorInvalidProtocol') {
        throw new Error('Đường dẫn gốc phải bắt đầu bằng http:// hoặc https://.');
      }
      if (validation.error === 'errorTooLong') {
        throw new Error('Đường dẫn gốc vượt quá độ dài tối đa 2.048 ký tự.');
      }
      throw new Error('Đường dẫn URL gốc không hợp lệ.');
    }

    const safety = await checkUrlSafetyApi(validation.sanitizedUrl);
    if (!safety.isSafe) {
      throw new Error(
        safety.reason || 'Đường dẫn vi phạm chính sách an toàn của ToolHub.',
      );
    }

    sanitizedUrl = validation.sanitizedUrl;
  }

  const candidateSlug = parsedSlug || normalizeSlug(generateRandomSlug(6, 8));
  const knownLink = parsedSlug
    ? await lookupLinkWithoutTracking(parsedSlug)
    : { exists: false, originalUrl: null };
  let resolvedUrl = sanitizedUrl || knownLink.originalUrl || undefined;
  const cleanOrigin = origin.replace(/\/+$/, '');
  const formatShortUrl = (slugValue: string) =>
    cleanOrigin ? `${cleanOrigin}/s/${slugValue}` : `/s/${slugValue}`;

  let persistedSlug = candidateSlug;
  let persistedId = `link_${Date.now()}_${candidateSlug}`;
  let isReusedDuplicate = false;

  if (sanitizedUrl && !knownLink.exists) {
    try {
      const rawCreated = (await createShortLink({
        originalUrl: sanitizedUrl,
        ...(parsedSlug ? { customSlug: parsedSlug } : {}),
      })) as LinkItem | { link?: LinkItem; isDuplicate?: boolean };

      const record =
        'link' in rawCreated && rawCreated.link
          ? rawCreated.link
          : (rawCreated as LinkItem);

      persistedSlug = normalizeSlug(record.slug) || candidateSlug;
      persistedId = record.id || persistedId;
      resolvedUrl = record.originalUrl || resolvedUrl;
      isReusedDuplicate = Boolean('isDuplicate' in rawCreated && rawCreated.isDuplicate);
    } catch (err: unknown) {
      const isNetworkFailure =
        err instanceof TypeError ||
        (err instanceof Error &&
          /failed to fetch|networkerror|load failed/i.test(err.message));
      if (!isNetworkFailure) {
        throw err;
      }
    }

    saveShortenedLink({
      id: persistedId,
      originalUrl: resolvedUrl || sanitizedUrl,
      shortUrl: formatShortUrl(persistedSlug),
      slug: persistedSlug,
      createdAt: new Date().toISOString(),
      clicks: 0,
    });
  }

  const isUpdated = Boolean(protectedLinkStorage.getMeta(persistedSlug)?.hasPassword);
  await protectedLinkStorage.setPassword(persistedSlug, password, resolvedUrl);

  return {
    slug: persistedSlug,
    shortUrl: formatShortUrl(persistedSlug),
    originalUrl: resolvedUrl,
    isUpdated,
    isReusedDuplicate,
  };
}
