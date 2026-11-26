import { buildUrlWithUtm } from '@/lib/link-api';
import type {
  BulkCsvInputRow,
  BulkCsvResultRow,
  ExportColumnKey,
  LinkExportFormat,
  NormalizedExportLink,
} from '@/types/bulk-csv';

const SLUG_REGEX = /^[a-zA-Z0-9-_]+$/;
const FORMULA_PREFIX_REGEX = /^[=+\-@\t\r]/;
const CSV_BOM = '\uFEFF';
export const MAX_BULK_CSV_ROWS = 500;

export interface ExportColumnDefinition {
  key: ExportColumnKey;
  header: string;
  label: string;
  defaultFormats: LinkExportFormat[];
}

export const EXPORT_COLUMNS: ExportColumnDefinition[] = [
  { key: 'slug', header: 'slug', label: 'Mã slug', defaultFormats: ['links', 'stats'] },
  { key: 'shortUrl', header: 'short_url', label: 'Link rút gọn', defaultFormats: ['links', 'stats'] },
  { key: 'originalUrl', header: 'original_url', label: 'URL gốc', defaultFormats: ['links', 'stats'] },
  { key: 'clickCount', header: 'click_count', label: 'Tổng lượt nhấp', defaultFormats: ['stats'] },
  {
    key: 'uniqueDailyClicks',
    header: 'unique_daily_clicks',
    label: 'Truy cập duy nhất/ngày',
    defaultFormats: ['stats'],
  },
  { key: 'statusLabel', header: 'status', label: 'Trạng thái', defaultFormats: ['links', 'stats'] },
  { key: 'ownerType', header: 'owner_type', label: 'Loại liên kết', defaultFormats: ['stats'] },
  { key: 'createdAt', header: 'created_at', label: 'Ngày tạo', defaultFormats: ['stats'] },
  { key: 'expiresAt', header: 'expires_at', label: 'Ngày hết hạn', defaultFormats: ['links', 'stats'] },
];

/**
 * Parse chuỗi CSV chuẩn RFC 4180 (hỗ trợ UTF-8 BOM, ngoặc kép "", xuống dòng trong ngoặc).
 */
export function parseCsvMatrix(rawText: string): string[][] {
  const text = (rawText || '').replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          currentCell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && text[i + 1] === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += ch;
    }
  }

  currentRow.push(currentCell.trim());
  if (currentRow.some((cell) => cell.length > 0)) {
    rows.push(currentRow);
  }

  return rows;
}

function normalizeHeaderName(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function validateBulkUrlAndSlug(
  rawUrl: string,
  customSlug: string,
  seenSlugs: Set<string>,
): { sanitizedUrl: string; error?: string } {
  const trimmedUrl = (rawUrl || '').trim();
  if (!trimmedUrl) {
    return { sanitizedUrl: '', error: 'Thiếu URL gốc' };
  }
  if (trimmedUrl.length > 2048) {
    return { sanitizedUrl: trimmedUrl, error: 'URL vượt quá 2048 ký tự' };
  }
  if (!/^https?:\/\//i.test(trimmedUrl)) {
    return { sanitizedUrl: trimmedUrl, error: 'URL phải bắt đầu bằng http:// hoặc https://' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmedUrl);
  } catch {
    return { sanitizedUrl: trimmedUrl, error: 'Định dạng URL không hợp lệ' };
  }

  if (parsed.username || parsed.password) {
    return { sanitizedUrl: trimmedUrl, error: 'URL không được chứa thông tin đăng nhập (user:pass)' };
  }
  if (!parsed.hostname || (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost')) {
    return { sanitizedUrl: trimmedUrl, error: 'Tên miền URL không hợp lệ' };
  }

  if (customSlug) {
    if (customSlug.length < 3 || customSlug.length > 32) {
      return { sanitizedUrl: parsed.href, error: 'Slug tùy chỉnh phải từ 3 đến 32 ký tự' };
    }
    if (!SLUG_REGEX.test(customSlug)) {
      return {
        sanitizedUrl: parsed.href,
        error: 'Slug chỉ được chứa chữ cái, số, gạch ngang (-) và gạch dưới (_)',
      };
    }
    const lowerSlug = customSlug.toLowerCase();
    if (seenSlugs.has(lowerSlug)) {
      return { sanitizedUrl: parsed.href, error: `Trùng slug "${customSlug}" trong cùng tệp CSV` };
    }
    seenSlugs.add(lowerSlug);
  }

  return { sanitizedUrl: parsed.href };
}

/**
 * Chuyển nội dung tệp CSV thành danh sách dòng kèm kết quả kiểm tra cú pháp phía client.
 */
export function parseBulkCsvContent(rawText: string): {
  rows: BulkCsvInputRow[];
  warnings: string[];
} {
  const matrix = parseCsvMatrix(rawText);
  if (matrix.length === 0) {
    return { rows: [], warnings: ['Tệp CSV không có dữ liệu.'] };
  }

  const warnings: string[] = [];
  const firstRowNormalized = matrix[0].map(normalizeHeaderName);
  const urlColAliases = ['original_url', 'originalurl', 'url', 'target_url', 'link'];
  const slugColAliases = ['custom_slug', 'customslug', 'slug'];

  const hasExplicitHeader =
    firstRowNormalized.some((h) => urlColAliases.includes(h)) ||
    firstRowNormalized.some((h) => slugColAliases.includes(h));

  let urlIdx = 0;
  let slugIdx = 1;
  let utmSourceIdx = -1;
  let utmMediumIdx = -1;
  let utmCampaignIdx = -1;
  let startRow = 0;

  if (hasExplicitHeader) {
    const detectedUrlIdx = firstRowNormalized.findIndex((h) => urlColAliases.includes(h));
    urlIdx = detectedUrlIdx >= 0 ? detectedUrlIdx : 0;
    slugIdx = firstRowNormalized.findIndex((h) => slugColAliases.includes(h));
    utmSourceIdx = firstRowNormalized.indexOf('utm_source');
    utmMediumIdx = firstRowNormalized.indexOf('utm_medium');
    utmCampaignIdx = firstRowNormalized.indexOf('utm_campaign');
    startRow = 1;
  } else {
    warnings.push('Không phát hiện dòng tiêu đề cột; tự động đọc cột 1 là URL gốc và cột 2 là slug tùy chỉnh.');
  }

  const dataRows = matrix.slice(startRow);
  if (dataRows.length > MAX_BULK_CSV_ROWS) {
    warnings.push(
      `Tệp có ${dataRows.length} dòng; hệ thống giới hạn tối đa ${MAX_BULK_CSV_ROWS} dòng mỗi lần xử lý.`,
    );
  }

  const bounded = dataRows.slice(0, MAX_BULK_CSV_ROWS);
  const seenSlugs = new Set<string>();

  const rows: BulkCsvInputRow[] = bounded.map((cols, index) => {
    const rawUrl = cols[urlIdx] || '';
    const customSlug = slugIdx >= 0 ? (cols[slugIdx] || '').trim() : '';
    const utmSource = utmSourceIdx >= 0 ? (cols[utmSourceIdx] || '').trim() : '';
    const utmMedium = utmMediumIdx >= 0 ? (cols[utmMediumIdx] || '').trim() : '';
    const utmCampaign = utmCampaignIdx >= 0 ? (cols[utmCampaignIdx] || '').trim() : '';

    const validation = validateBulkUrlAndSlug(rawUrl, customSlug, seenSlugs);
    let finalUrl = validation.sanitizedUrl || rawUrl.trim();
    if (!validation.error && (utmSource || utmMedium || utmCampaign)) {
      finalUrl = buildUrlWithUtm(finalUrl, {
        source: utmSource,
        medium: utmMedium,
        campaign: utmCampaign,
      });
    }

    return {
      rowNumber: index + 1,
      originalUrl: finalUrl,
      customSlug,
      ...(utmSource ? { utmSource } : {}),
      ...(utmMedium ? { utmMedium } : {}),
      ...(utmCampaign ? { utmCampaign } : {}),
      ...(validation.error ? { validationError: validation.error } : {}),
    };
  });

  return { rows, warnings };
}

/**
 * Làm sạch giá trị trước khi xuất CSV: chống CSV Formula Injection và quote đúng RFC 4180.
 */
export function sanitizeCsvCell(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value);
  const neutralized = FORMULA_PREFIX_REGEX.test(raw) ? `'${raw}` : raw;
  if (/[",\r\n]/.test(neutralized)) {
    return `"${neutralized.replace(/"/g, '""')}"`;
  }
  return neutralized;
}

export function serializeCsv(
  headers: string[],
  rows: unknown[][],
  includeBom = true,
): string {
  const headerLine = headers.map(sanitizeCsvCell).join(',');
  const dataLines = rows.map((row) => row.map(sanitizeCsvCell).join(','));
  const body = [headerLine, ...dataLines].join('\r\n');
  return includeBom ? `${CSV_BOM}${body}` : body;
}

export function buildSampleBulkCsv(): string {
  return serializeCsv(
    ['original_url', 'custom_slug', 'utm_source', 'utm_medium', 'utm_campaign'],
    [
      ['https://ten-mien-cua-ban.vn/trang-dich', 'trang-dich-2026', 'newsletter', 'email', 'chien_dich_1'],
      ['https://ten-mien-cua-ban.vn/tai-lieu', 'tai-lieu-huong-dan', '', '', ''],
    ],
  );
}

export function buildBulkResultCsv(rows: BulkCsvResultRow[]): string {
  const statusMap: Record<BulkCsvResultRow['status'], string> = {
    pending: 'PENDING',
    processing: 'PROCESSING',
    created: 'CREATED',
    reused: 'REUSED_DUPLICATE',
    error: 'ERROR',
  };

  return serializeCsv(
    ['row', 'original_url', 'custom_slug', 'short_url', 'slug', 'status', 'message'],
    rows.map((row) => [
      row.rowNumber,
      row.originalUrl,
      row.customSlug,
      row.shortUrl,
      row.slug,
      statusMap[row.status],
      row.message,
    ]),
  );
}

export function formatExportStatusLabel(status: NormalizedExportLink['status']): string {
  switch (status) {
    case 'active':
      return 'Đang hoạt động';
    case 'disabled':
      return 'Đang tạm tắt';
    case 'expired':
      return 'Đã hết hạn';
  }
}

const EXPORT_CELL_EXTRACTORS: Record<
  ExportColumnKey,
  (item: NormalizedExportLink) => string | number
> = {
  slug: (item) => item.slug,
  shortUrl: (item) => item.shortUrl,
  originalUrl: (item) => item.originalUrl,
  clickCount: (item) => item.clickCount,
  uniqueDailyClicks: (item) => item.uniqueDailyClicks,
  statusLabel: (item) => formatExportStatusLabel(item.status),
  ownerType: (item) => (item.isGuest ? 'Khách (30 ngày)' : 'Thành viên'),
  createdAt: (item) => item.createdAt,
  expiresAt: (item) => item.expiresAt,
};

export function buildLinksExportCsv(
  items: NormalizedExportLink[],
  format: LinkExportFormat,
  selectedColumns?: ExportColumnKey[],
): string {
  const activeColumns =
    selectedColumns && selectedColumns.length > 0
      ? EXPORT_COLUMNS.filter((col) => selectedColumns.includes(col.key))
      : EXPORT_COLUMNS.filter((col) => col.defaultFormats.includes(format));

  const headers = activeColumns.map((col) => col.header);
  const rows = items.map((item) =>
    activeColumns.map((col) => EXPORT_CELL_EXTRACTORS[col.key](item)),
  );

  return serializeCsv(headers, rows);
}
