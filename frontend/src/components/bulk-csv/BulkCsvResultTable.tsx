'use client';

import React, { useMemo, useState } from 'react';
import {
  CheckCircleIcon,
  CopyIcon,
  DownloadIcon,
  SearchIcon,
  SpinnerIcon,
} from '@/components/ui/Icons';
import type { BulkCsvResultRow } from '@/types/bulk-csv';
import { getBulkRowStatusMeta, RefreshIcon } from './BulkCsvIcons';
import { CsvRawPreviewBox } from './CsvRawPreviewBox';

export type BulkResultFilter = 'all' | 'created' | 'reused' | 'error';

export interface BatchSummaryCounts {
  total: number;
  valid: number;
  created: number;
  reused: number;
  errors: number;
  retryableErrors: number;
}

interface BulkCsvResultTableProps {
  rows: BulkCsvResultRow[];
  summary: BatchSummaryCounts;
  hasExecuted: boolean;
  isProcessing: boolean;
  processedCount: number;
  resultCsvText: string;
  copiedKey: string | null;
  onCopy: (value: string, key: string) => void;
  onCopyAllSuccess: () => void;
  onRetryFailed: () => void;
  onDownloadResultCsv: () => void;
}

/**
 * Bảng xem trước dữ liệu CSV đầu vào, tiến độ chạy và kết quả tạo từng dòng.
 */
export function BulkCsvResultTable({
  rows,
  summary,
  hasExecuted,
  isProcessing,
  processedCount,
  resultCsvText,
  copiedKey,
  onCopy,
  onCopyAllSuccess,
  onRetryFailed,
  onDownloadResultCsv,
}: BulkCsvResultTableProps) {
  const [resultFilter, setResultFilter] = useState<BulkResultFilter>('all');
  const [tableSearch, setTableSearch] = useState('');
  const [showCsvPreview, setShowCsvPreview] = useState(false);

  const filteredRows = useMemo(() => {
    const keyword = tableSearch.trim().toLowerCase();
    return rows.filter((row) => {
      if (resultFilter !== 'all' && row.status !== resultFilter) return false;
      if (!keyword) return true;
      return (
        row.originalUrl.toLowerCase().includes(keyword) ||
        row.customSlug.toLowerCase().includes(keyword) ||
        row.slug.toLowerCase().includes(keyword) ||
        row.message.toLowerCase().includes(keyword)
      );
    });
  }, [rows, resultFilter, tableSearch]);

  if (rows.length === 0) return null;

  const progressPercent =
    summary.total > 0 ? Math.round((processedCount / summary.total) * 100) : 0;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">
            Bảng xem trước &amp; Kết quả từng dòng ({summary.total})
          </h3>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>
              Hợp lệ: <strong className="text-foreground">{summary.valid}</strong>
            </span>
            {hasExecuted && (
              <>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Tạo mới: {summary.created}
                </span>
                <span>•</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  Trùng dùng lại: {summary.reused}
                </span>
              </>
            )}
            <span>•</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">
              Lỗi: {summary.errors}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasExecuted && summary.retryableErrors > 0 && !isProcessing && (
            <button
              type="button"
              onClick={onRetryFailed}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:opacity-90 transition cursor-pointer"
            >
              <RefreshIcon className="w-3.5 h-3.5" />
              <span>Thử lại dòng lỗi ({summary.retryableErrors})</span>
            </button>
          )}

          {hasExecuted && summary.created + summary.reused > 0 && (
            <button
              type="button"
              onClick={onCopyAllSuccess}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border bg-secondary text-secondary-foreground hover:opacity-90 transition cursor-pointer"
            >
              {copiedKey === 'all-short-links' ? (
                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <CopyIcon className="w-3.5 h-3.5" />
              )}
              <span>
                {copiedKey === 'all-short-links' ? 'Đã sao chép tất cả' : 'Sao chép link thành công'}
              </span>
            </button>
          )}

          {hasExecuted && (
            <>
              <button
                type="button"
                onClick={() => setShowCsvPreview((v) => !v)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                {showCsvPreview ? 'Ẩn CSV kết quả' : 'Xem trước CSV'}
              </button>
              <button
                type="button"
                onClick={onDownloadResultCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
              >
                <DownloadIcon className="w-3.5 h-3.5" />
                <span>Tải CSV kết quả</span>
              </button>
            </>
          )}
        </div>
      </div>

      {(isProcessing || hasExecuted) && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Tiến độ xử lý</span>
            <span className="font-mono">
              {processedCount}/{summary.total} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {(hasExecuted || rows.length > 5) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {hasExecuted ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  ['all', `Tất cả (${summary.total})`],
                  ['created', `Tạo mới (${summary.created})`],
                  ['reused', `Trùng dùng lại (${summary.reused})`],
                  ['error', `Lỗi (${summary.errors})`],
                ] as [BulkResultFilter, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setResultFilter(key)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    resultFilter === key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <div />
          )}

          {rows.length > 5 && (
            <div className="relative w-full sm:w-64">
              <SearchIcon className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Tìm dòng trong bảng..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto border border-border rounded-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/60 text-muted-foreground">
              <th className="py-2.5 px-3 font-semibold">#</th>
              <th className="py-2.5 px-3 font-semibold">URL gốc</th>
              <th className="py-2.5 px-3 font-semibold">Slug tùy chỉnh</th>
              <th className="py-2.5 px-3 font-semibold">Link rút gọn</th>
              <th className="py-2.5 px-3 font-semibold">Trạng thái</th>
              <th className="py-2.5 px-3 font-semibold">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-xs text-muted-foreground">
                  Không có dòng nào khớp bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const statusMeta = getBulkRowStatusMeta(row.status);
                const copyId = `row-${row.rowNumber}`;
                return (
                  <tr key={row.rowNumber} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-muted-foreground">{row.rowNumber}</td>
                    <td className="py-2.5 px-3 max-w-xs truncate font-mono" title={row.originalUrl}>
                      {row.originalUrl || '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground">
                      {row.customSlug || '(tự sinh)'}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {row.shortUrl ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                            /s/{row.slug}
                          </span>
                          <button
                            type="button"
                            onClick={() => onCopy(row.shortUrl, copyId)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Sao chép link rút gọn"
                          >
                            {copiedKey === copyId ? (
                              <>
                                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[11px] font-sans text-emerald-600 font-medium">
                                  Đã chép
                                </span>
                              </>
                            ) : (
                              <CopyIcon className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${statusMeta.badgeClass}`}
                      >
                        {row.status === 'processing' && <SpinnerIcon className="w-3 h-3" />}
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground max-w-sm">{row.message}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <CsvRawPreviewBox
        title="Xem trước nội dung tệp CSV kết quả (chuẩn UTF-8 BOM):"
        content={resultCsvText}
        visible={showCsvPreview}
      />
    </div>
  );
}
