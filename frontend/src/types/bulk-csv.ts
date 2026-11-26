export type CsvDuplicateMode = 'reuse' | 'forceNew';

export type BulkCsvRowStatus =
  | 'pending'
  | 'processing'
  | 'created'
  | 'reused'
  | 'error';

export interface BulkCsvInputRow {
  rowNumber: number;
  originalUrl: string;
  customSlug: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  validationError?: string;
}

export interface BulkCsvResultRow extends BulkCsvInputRow {
  status: BulkCsvRowStatus;
  shortUrl: string;
  slug: string;
  message: string;
}

export type LinkExportStatusFilter = 'all' | 'active' | 'disabled' | 'expired';

export type LinkExportSortOption = 'newest' | 'mostClicks' | 'leastClicks';

export type LinkExportFormat = 'stats' | 'links';

export type ExportColumnKey =
  | 'slug'
  | 'shortUrl'
  | 'originalUrl'
  | 'clickCount'
  | 'uniqueDailyClicks'
  | 'statusLabel'
  | 'ownerType'
  | 'createdAt'
  | 'expiresAt';

export interface NormalizedExportLink {
  id: string;
  slug: string;
  shortUrl: string;
  originalUrl: string;
  clickCount: number;
  uniqueDailyClicks: number;
  isActive: boolean;
  isGuest: boolean;
  status: Exclude<LinkExportStatusFilter, 'all'>;
  createdAt: string;
  expiresAt: string;
  source: 'backend' | 'local';
}
