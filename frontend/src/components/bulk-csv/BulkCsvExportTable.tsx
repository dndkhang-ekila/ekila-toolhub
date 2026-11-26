'use client';

import React from 'react';
import { SpinnerIcon } from '@/components/ui/Icons';
import type { NormalizedExportLink } from '@/types/bulk-csv';
import { getExportStatusMeta } from './BulkCsvIcons';

function formatShortDate(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('vi-VN');
}

interface BulkCsvExportTableProps {
  loading: boolean;
  links: NormalizedExportLink[];
}

/**
 * Bảng hiển thị danh sách link đã lọc kèm thống kê lượt click và ngày hết hạn trước khi xuất CSV.
 */
export function BulkCsvExportTable({ loading, links }: BulkCsvExportTableProps) {
  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
        <SpinnerIcon className="w-5 h-5 text-indigo-600" />
        <span>Đang tải danh sách liên kết...</span>
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="py-12 text-center border border-dashed border-border rounded-2xl space-y-1.5">
        <p className="text-sm font-semibold text-foreground">
          Không có liên kết nào phù hợp để xuất CSV
        </p>
        <p className="text-xs text-muted-foreground">
          Hãy tạo liên kết mới ở tab &ldquo;Nhập CSV tạo hàng loạt&rdquo; hoặc thay đổi bộ lọc ở trên.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-border rounded-xl">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/60 text-muted-foreground">
            <th className="py-2.5 px-3 font-semibold">Slug</th>
            <th className="py-2.5 px-3 font-semibold">URL gốc</th>
            <th className="py-2.5 px-3 font-semibold">Lượt nhấp</th>
            <th className="py-2.5 px-3 font-semibold">Duy nhất/ngày</th>
            <th className="py-2.5 px-3 font-semibold">Trạng thái</th>
            <th className="py-2.5 px-3 font-semibold">Loại liên kết</th>
            <th className="py-2.5 px-3 font-semibold">Hết hạn</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {links.map((item) => {
            const statusMeta = getExportStatusMeta(item.status);
            return (
              <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-2.5 px-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                  /s/{item.slug}
                </td>
                <td className="py-2.5 px-3 max-w-xs truncate font-mono" title={item.originalUrl}>
                  {item.originalUrl}
                </td>
                <td className="py-2.5 px-3 font-semibold text-foreground">{item.clickCount}</td>
                <td className="py-2.5 px-3 text-muted-foreground">{item.uniqueDailyClicks}</td>
                <td className="py-2.5 px-3">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${statusMeta.badgeClass}`}>
                    {statusMeta.label}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-muted-foreground">
                  {item.isGuest ? 'Khách (30d)' : 'Thành viên'}
                </td>
                <td className="py-2.5 px-3 font-mono text-muted-foreground">
                  {formatShortDate(item.expiresAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
