import { tokenStorage } from '@/lib/api';
import {
  getRecentShortenedLinks,
  saveShortenedLink,
} from '@/lib/url-shortener';
import type {
  BulkCsvInputRow,
  BulkCsvResultRow,
  CsvDuplicateMode,
  NormalizedExportLink,
} from '@/types/bulk-csv';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface BackendLinkPayload {
  id?: string;
  slug?: string;
  originalUrl?: string;
  shortUrl?: string;
  userId?: string | null;
  isGuest?: boolean;
  isActive?: boolean;
  clickCount?: number;
  totalClicks?: number;
  uniqueDailyHashes?: string[];
  createdAt?: string | Date;
  expiresAt?: string | Date | null;
}

/**
 * Chỉ đính kèm thông tin xác thực khi người dùng thực sự đã đăng nhập.
 * Khi chưa đăng nhập (Khách), không gửi user ID giả lập để tuân thủ BR-URL-01.
 */
function getAuthenticatedHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = tokenStorage.get();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const user = tokenStorage.getUser();
  if (user?.id) {
    headers['x-user-id'] = user.id;
  }

  return headers;
}

function toIsoStringSafe(value: string | Date | null | undefined, fallback = ''): string {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function resolveLinkStatus(
  isActive: boolean,
  expiresAtIso: string,
): NormalizedExportLink['status'] {
  if (!isActive) return 'disabled';
  if (expiresAtIso) {
    const expiry = new Date(expiresAtIso);
    if (!Number.isNaN(expiry.getTime()) && Date.now() > expiry.getTime()) {
      return 'expired';
    }
  }
  return 'active';
}

function getShortLinkUrl(slug: string, origin: string): string {
  const cleanOrigin = origin ? origin.replace(/\/+$/, '') : '';
  return cleanOrigin ? `${cleanOrigin}/s/${slug}` : `/s/${slug}`;
}

function extractBackendErrorMessage(payload: Record<string, unknown>, status: number): string {
  if (typeof payload?.message === 'string') return payload.message;
  if (Array.isArray(payload?.message)) return payload.message.join('; ');
  return `Máy chủ từ chối yêu cầu (HTTP ${status})`;
}

function buildErrorResultRow(row: BulkCsvInputRow, message: string): BulkCsvResultRow {
  return {
    ...row,
    status: 'error',
    shortUrl: '',
    slug: '',
    message,
  };
}

/**
 * Xử lý tạo 1 dòng từ CSV qua API Backend POST /api/v1/links (tuân thủ BR-URL-01..02).
 * Không tạo link giả lập phía client khi mất kết nối máy chủ.
 */
export async function processBulkCsvRow(
  row: BulkCsvInputRow,
  duplicateMode: CsvDuplicateMode,
  origin: string,
  signal?: AbortSignal,
): Promise<BulkCsvResultRow> {
  if (row.validationError) {
    return buildErrorResultRow(row, row.validationError);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/links`, {
      method: 'POST',
      headers: getAuthenticatedHeaders(),
      signal,
      body: JSON.stringify({
        originalUrl: row.originalUrl,
        ...(row.customSlug ? { customSlug: row.customSlug } : {}),
        forceNew: duplicateMode === 'forceNew',
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      return buildErrorResultRow(row, extractBackendErrorMessage(payload, response.status));
    }

    const linkRecord = ((payload?.link || payload) ?? {}) as BackendLinkPayload;
    const finalSlug = (linkRecord.slug || row.customSlug || '').trim();
    if (!finalSlug) {
      return buildErrorResultRow(row, 'Phản hồi máy chủ thiếu mã slug.');
    }

    const shortUrl = getShortLinkUrl(finalSlug, origin);
    const isDuplicate = Boolean(payload?.isDuplicate);

    saveShortenedLink({
      id: linkRecord.id || `link_${Date.now()}_${finalSlug}`,
      originalUrl: linkRecord.originalUrl || row.originalUrl,
      shortUrl,
      slug: finalSlug,
      createdAt: toIsoStringSafe(linkRecord.createdAt, new Date().toISOString()),
      clicks: linkRecord.clickCount ?? linkRecord.totalClicks ?? 0,
    });

    return {
      ...row,
      status: isDuplicate ? 'reused' : 'created',
      slug: finalSlug,
      shortUrl,
      message: isDuplicate
        ? 'URL đã từng rút gọn — đã tái sử dụng liên kết cũ'
        : 'Tạo liên kết rút gọn thành công',
    };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return buildErrorResultRow(row, 'Đã dừng theo yêu cầu người dùng');
    }
    return buildErrorResultRow(
      row,
      'Không thể kết nối tới máy chủ Backend API để tạo liên kết',
    );
  }
}

export interface LoadExportLinksResult {
  links: NormalizedExportLink[];
  backendAvailable: boolean;
  backendError?: string;
}

/**
 * Tải danh sách link & thống kê thực tế từ Backend (GET /api/v1/links nếu đã đăng nhập)
 * và kết hợp các liên kết người dùng đã tạo trên trình duyệt hiện tại.
 */
export async function loadNormalizedLinksForExport(
  origin: string,
): Promise<LoadExportLinksResult> {
  const bySlug = new Map<string, NormalizedExportLink>();
  const isAuthenticated = Boolean(tokenStorage.get() || tokenStorage.getUser()?.id);
  let backendAvailable = false;
  let backendError: string | undefined;

  if (isAuthenticated) {
    try {
      const response = await fetch(`${API_BASE_URL}/links`, {
        method: 'GET',
        headers: getAuthenticatedHeaders(),
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          backendAvailable = true;
          for (const raw of data as BackendLinkPayload[]) {
            const slug = (raw.slug || '').trim();
            if (!slug) continue;
            const isActive = raw.isActive !== false;
            const expiresAt = toIsoStringSafe(raw.expiresAt);
            const createdAt = toIsoStringSafe(raw.createdAt);
            bySlug.set(slug.toLowerCase(), {
              id: raw.id || `lnk_${slug}`,
              slug,
              shortUrl: getShortLinkUrl(slug, origin),
              originalUrl: raw.originalUrl || '',
              clickCount: raw.clickCount ?? raw.totalClicks ?? 0,
              uniqueDailyClicks: Array.isArray(raw.uniqueDailyHashes)
                ? raw.uniqueDailyHashes.length
                : 0,
              isActive,
              isGuest: Boolean(raw.isGuest),
              status: resolveLinkStatus(isActive, expiresAt),
              createdAt,
              expiresAt,
              source: 'backend',
            });
          }
        }
      } else {
        backendError = `Không thể tải dữ liệu từ máy chủ (HTTP ${response.status}).`;
      }
    } catch {
      backendError = 'Không thể kết nối tới Backend API; đang hiển thị dữ liệu đã tạo trên trình duyệt.';
    }
  }

  for (const localItem of getRecentShortenedLinks()) {
    const slug = (localItem.slug || '').trim();
    if (!slug || bySlug.has(slug.toLowerCase())) continue;
    const createdAt = toIsoStringSafe(localItem.createdAt);
    const expiryDate = createdAt
      ? new Date(new Date(createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : '';
    bySlug.set(slug.toLowerCase(), {
      id: localItem.id,
      slug,
      shortUrl: getShortLinkUrl(slug, origin),
      originalUrl: localItem.originalUrl,
      clickCount: localItem.clicks ?? 0,
      uniqueDailyClicks: 0,
      isActive: true,
      isGuest: !isAuthenticated,
      status: resolveLinkStatus(true, expiryDate),
      createdAt,
      expiresAt: expiryDate,
      source: 'local',
    });
  }

  const links = Array.from(bySlug.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  return { links, backendAvailable, backendError };
}

export function triggerCsvDownload(filename: string, csvContent: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
