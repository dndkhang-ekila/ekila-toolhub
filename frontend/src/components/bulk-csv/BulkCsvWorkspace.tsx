'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { ArrowLeftIcon } from '@/components/ui/Icons';
import { BarChartIcon, TableIcon } from './BulkCsvIcons';
import { BulkCsvExportPanel } from './BulkCsvExportPanel';
import { BulkCsvImportPanel } from './BulkCsvImportPanel';

const FLOW_STEPS: Record<'import' | 'export', string[]> = {
  import: [
    '1. Chọn hoặc dán tệp CSV',
    '2. Kiểm tra trước & Cấu hình trùng lặp',
    '3. Rút gọn từng dòng & Tải CSV kết quả',
  ],
  export: [
    '1. Đồng bộ danh sách & Lượt nhấp',
    '2. Lọc trạng thái, Sắp xếp & Chọn cột',
    '3. Xuất báo cáo CSV mở chuẩn trên Excel',
  ],
};

export function BulkCsvWorkspace() {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [exportRefreshTrigger, setExportRefreshTrigger] = useState(0);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background py-6 sm:py-8 px-4 sm:px-6 transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top quick breadcrumb */}
        <nav className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-medium hover:text-foreground transition"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span>Trang chủ</span>
            </Link>
            <span>/</span>
            <span className="font-semibold text-foreground">Tạo hàng loạt &amp; Xuất CSV</span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/shorten-url" className="hover:text-foreground transition font-medium">
              Rút gọn đơn lẻ
            </Link>
            <span>•</span>
            <Link href="/links" className="hover:text-foreground transition font-medium">
              Quản lý liên kết
            </Link>
          </div>
        </nav>

        {/* Header & Mode Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Tạo link hàng loạt &amp; Xuất báo cáo CSV
            </h1>
            <p className="text-sm text-muted-foreground">
              Nhập tệp CSV để rút gọn nhiều liên kết cùng lúc hoặc xuất danh sách và thống kê lượt nhấp ra Excel CSV.
            </p>
          </div>

          <div className="inline-flex items-center p-1 rounded-2xl bg-card border border-border shadow-xs self-start">
            <button
              type="button"
              onClick={() => setActiveTab('import')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === 'import'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>Nhập CSV tạo hàng loạt</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('export')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === 'export'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChartIcon className="w-4 h-4" />
              <span>Xuất danh sách &amp; Thống kê</span>
            </button>
          </div>
        </div>

        {/* 3-step visual orientation strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {FLOW_STEPS[activeTab].map((step) => (
            <div
              key={step}
              className="px-3.5 py-2 rounded-xl bg-card border border-border text-xs font-medium text-muted-foreground"
            >
              {step}
            </div>
          ))}
        </div>

        {activeTab === 'import' ? (
          <BulkCsvImportPanel
            onBatchCompleted={() => setExportRefreshTrigger((prev) => prev + 1)}
          />
        ) : (
          <BulkCsvExportPanel refreshTrigger={exportRefreshTrigger} />
        )}
      </div>
    </div>
  );
}
