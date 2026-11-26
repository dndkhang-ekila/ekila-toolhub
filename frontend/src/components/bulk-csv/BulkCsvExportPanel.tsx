'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  DownloadIcon,
  LinkIcon,
  SearchIcon,
} from '@/components/ui/Icons';
import {
  buildLinksExportCsv,
  EXPORT_COLUMNS,
} from '@/lib/bulk-csv-parser';
import {
  loadNormalizedLinksForExport,
  triggerCsvDownload,
} from '@/lib/bulk-csv-service';
import type {
  ExportColumnKey,
  LinkExportFormat,
  LinkExportSortOption,
  LinkExportStatusFilter,
  NormalizedExportLink,
} from '@/types/bulk-csv';
import { BulkCsvExportTable } from './BulkCsvExportTable';
import { BarChartIcon, RefreshIcon } from './BulkCsvIcons';
import { CsvRawPreviewBox } from './CsvRawPreviewBox';

function getDefaultColumnsForFormat(format: LinkExportFormat): ExportColumnKey[] {
  return EXPORT_COLUMNS.filter((col) => col.defaultFormats.includes(format)).map(
    (col) => col.key,
  );
}

/**
 * Luồng lọc, thống kê và xuất danh sách liên kết rút gọn ra tệp CSV chuẩn UTF-8 BOM.
 */
export function BulkCsvExportPanel({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
  const [links, setLinks] = useState<NormalizedExportLink[]>([]);
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [backendError, setBackendError] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LinkExportStatusFilter>('all');
  const [sortOption, setSortOption] = useState<LinkExportSortOption>('newest');
  const [exportFormat, setExportFormat] = useState<LinkExportFormat>('stats');
  const [selectedColumns, setSelectedColumns] = useState<ExportColumnKey[]>(() =>
    getDefaultColumnsForFormat('stats'),
  );
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [lastExportedNotice, setLastExportedNotice] = useState('');

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const result = await loadNormalizedLinksForExport(origin);
    setLinks(result.links);
    setBackendAvailable(result.backendAvailable);
    setBackendError(result.backendError);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    void loadNormalizedLinksForExport(origin).then((result) => {
      if (!active) return;
      setLinks(result.links);
      setBackendAvailable(result.backendAvailable);
      setBackendError(result.backendError);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  const handleFormatChange = (nextFormat: LinkExportFormat) => {
    setExportFormat(nextFormat);
    setSelectedColumns(getDefaultColumnsForFormat(nextFormat));
  };

  const toggleColumn = (key: ExportColumnKey) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const filteredLinks = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const matched = links.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!keyword) return true;
      return (
        item.slug.toLowerCase().includes(keyword) ||
        item.originalUrl.toLowerCase().includes(keyword)
      );
    });

    if (sortOption === 'mostClicks') {
      return [...matched].sort((a, b) => b.clickCount - a.clickCount);
    }
    if (sortOption === 'leastClicks') {
      return [...matched].sort((a, b) => a.clickCount - b.clickCount);
    }
    return matched;
  }, [links, search, statusFilter, sortOption]);

  const kpiCards = useMemo(() => {
    const total = filteredLinks.length;
    const active = filteredLinks.filter((i) => i.status === 'active').length;
    const clicks = filteredLinks.reduce((acc, item) => acc + item.clickCount, 0);
    const uniqueDaily = filteredLinks.reduce((acc, item) => acc + item.uniqueDailyClicks, 0);
    return [
      { label: 'Liên kết theo bộ lọc', value: total, colorClass: 'text-foreground' },
      { label: 'Đang hoạt động', value: active, colorClass: 'text-emerald-600 dark:text-emerald-400' },
      { label: 'Tổng lượt nhấp', value: clicks, colorClass: 'text-indigo-600 dark:text-indigo-400' },
      { label: 'Truy cập duy nhất/ngày', value: uniqueDaily, colorClass: 'text-blue-600 dark:text-blue-400' },
    ];
  }, [filteredLinks]);

  const previewCsv = useMemo(() => {
    if (filteredLinks.length === 0 || selectedColumns.length === 0) return '';
    return buildLinksExportCsv(filteredLinks, exportFormat, selectedColumns);
  }, [filteredLinks, exportFormat, selectedColumns]);

  const handleExportDownload = () => {
    if (!previewCsv) return;
    const dateTag = new Date().toISOString().slice(0, 10);
    const filePrefix = exportFormat === 'stats' ? 'toolhub-thong-ke-link' : 'toolhub-danh-sach-link';
    const filename = `${filePrefix}-${dateTag}.csv`;
    triggerCsvDownload(filename, previewCsv);
    setLastExportedNotice(`Đã xuất ${filteredLinks.length} dòng ra tệp ${filename}`);
    setTimeout(() => setLastExportedNotice(''), 3500);
  };

  return (
    <div className="space-y-6">
      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="p-4 rounded-2xl bg-card border border-border shadow-xs">
            <p className="text-xs font-semibold text-muted-foreground">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.colorClass}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Controls & Table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-foreground">
                Xuất danh sách liên kết &amp; Thống kê CSV
              </h2>
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                  backendAvailable
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-muted-foreground'
                }`}
              >
                {backendAvailable ? 'Đã đồng bộ tài khoản' : 'Phiên trình duyệt hiện tại'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Báo cáo thống kê tổng hợp lượt nhấp và lượt truy cập duy nhất theo ngày, bảo mật ẩn danh IP.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border bg-secondary text-secondary-foreground hover:opacity-90 transition cursor-pointer"
            >
              <RefreshIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCsvPreview((v) => !v)}
              disabled={!previewCsv}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:text-foreground disabled:opacity-50 transition cursor-pointer"
            >
              {showCsvPreview ? 'Ẩn CSV mẫu xuất' : 'Xem trước CSV'}
            </button>
            <button
              type="button"
              onClick={handleExportDownload}
              disabled={!previewCsv}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-xs transition cursor-pointer"
            >
              <DownloadIcon className="w-4 h-4" />
              <span>Xuất tệp CSV ({filteredLinks.length})</span>
            </button>
          </div>
        </div>

        {backendError && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 dark:border-amber-800/70 bg-amber-50/80 dark:bg-amber-950/40 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-200">
            <AlertCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{backendError}</span>
          </div>
        )}

        {lastExportedNotice && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50 dark:bg-emerald-950/50 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircleIcon className="w-4 h-4" />
            <span>{lastExportedNotice}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-1">
            <SearchIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Lọc slug hoặc URL..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LinkExportStatusFilter)}
            className="px-3 py-2 text-xs rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="disabled">Đang tạm tắt</option>
            <option value="expired">Đã hết hạn</option>
          </select>

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as LinkExportSortOption)}
            className="px-3 py-2 text-xs rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="newest">Sắp xếp: Mới nhất</option>
            <option value="mostClicks">Sắp xếp: Nhiều click nhất</option>
            <option value="leastClicks">Sắp xếp: Ít click nhất</option>
          </select>

          <div className="inline-flex p-1 rounded-xl border border-border bg-muted/50">
            <button
              type="button"
              onClick={() => handleFormatChange('stats')}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                exportFormat === 'stats'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChartIcon className="w-3.5 h-3.5" />
              <span>Thống kê</span>
            </button>
            <button
              type="button"
              onClick={() => handleFormatChange('links')}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                exportFormat === 'links'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Danh sách</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted-foreground">Cột dữ liệu sẽ xuất vào CSV:</p>
            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={() => setSelectedColumns(EXPORT_COLUMNS.map((c) => c.key))}
                className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Chọn tất cả
              </button>
              <button
                type="button"
                onClick={() => setSelectedColumns(getDefaultColumnsForFormat(exportFormat))}
                className="font-medium text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Khôi phục mặc định
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {EXPORT_COLUMNS.map((col) => {
              const checked = selectedColumns.includes(col.key);
              return (
                <label
                  key={col.key}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition cursor-pointer ${
                    checked
                      ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-foreground font-medium'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleColumn(col.key)}
                    className="accent-indigo-600"
                  />
                  <span>{col.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <BulkCsvExportTable loading={loading} links={filteredLinks} />

        <CsvRawPreviewBox
          title="Xem trước nội dung tệp CSV sẽ tải về (chuẩn UTF-8 BOM):"
          content={previewCsv}
          visible={showCsvPreview}
        />
      </div>
    </div>
  );
}
