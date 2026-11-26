'use client';

import React, { useState } from 'react';
import {
  AlertCircleIcon,
  DocumentIcon,
  DownloadIcon,
} from '@/components/ui/Icons';
import { UploadCloudIcon } from './BulkCsvIcons';

interface BulkCsvDropzoneCardProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  fileName: string;
  rowCount: number;
  warnings: string[];
  isProcessing: boolean;
  onSelectFile: (file: File | undefined) => void;
  onParseText: (rawText: string, sourceName: string) => void;
  onDownloadSample: () => void;
}

/**
 * Thẻ chọn tệp CSV bằng kéo thả, tải tệp mẫu hoặc dán trực tiếp nội dung CSV.
 */
export function BulkCsvDropzoneCard({
  fileInputRef,
  fileName,
  rowCount,
  warnings,
  isProcessing,
  onSelectFile,
  onParseText,
  onDownloadSample,
}: BulkCsvDropzoneCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isProcessing) {
      onSelectFile(e.dataTransfer.files?.[0]);
    }
  };

  const handleApplyPaste = () => {
    if (!pasteText.trim()) return;
    onParseText(pasteText, 'du-lieu-dan-truc-tiep.csv');
    setShowPasteBox(false);
  };

  return (
    <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-foreground">
            1. Chọn hoặc tải lên tệp CSV
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Chuẩn bị tệp <code className="font-mono text-foreground">.csv</code> chứa danh sách liên kết cần rút gọn hàng loạt.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDownloadSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border bg-secondary text-secondary-foreground hover:opacity-90 transition cursor-pointer"
          >
            <DownloadIcon className="w-3.5 h-3.5" />
            <span>Tải CSV mẫu</span>
          </button>
          <button
            type="button"
            onClick={() => setShowPasteBox((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            <DocumentIcon className="w-3.5 h-3.5" />
            <span>{showPasteBox ? 'Ẩn ô dán' : 'Dán nội dung CSV'}</span>
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => onSelectFile(e.target.files?.[0])}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isProcessing) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`rounded-2xl border-2 border-dashed p-6 sm:p-7 text-center transition cursor-pointer ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/30'
            : 'border-border bg-muted/40 hover:border-indigo-400 dark:hover:border-indigo-500'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
          <UploadCloudIcon className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">
          {fileName
            ? `Đã nạp ${rowCount} dòng từ tệp "${fileName}"`
            : 'Kéo thả tệp .csv vào đây hoặc nhấn để chọn tệp'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Tối đa 500 dòng mỗi lượt • Kiểm tra định dạng URL và slug trùng trước khi gửi
        </p>

        {/* Inline accepted schema chips */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
          <span className="px-2 py-0.5 rounded-md bg-card border border-border font-mono text-foreground">
            original_url <span className="text-rose-500">*</span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-card border border-border font-mono text-muted-foreground">
            custom_slug
          </span>
          <span className="px-2 py-0.5 rounded-md bg-card border border-border font-mono text-muted-foreground">
            utm_source
          </span>
          <span className="px-2 py-0.5 rounded-md bg-card border border-border font-mono text-muted-foreground">
            utm_medium
          </span>
          <span className="px-2 py-0.5 rounded-md bg-card border border-border font-mono text-muted-foreground">
            utm_campaign
          </span>
        </div>
      </div>

      {showPasteBox && (
        <div className="space-y-2 pt-1">
          <textarea
            rows={4}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={'original_url,custom_slug\nhttps://ten-mien-cua-ban.vn/san-pham,san-pham-1'}
            className="w-full rounded-xl border border-input bg-background p-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowPasteBox(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleApplyPaste}
              disabled={!pasteText.trim()}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              Đọc dữ liệu CSV
            </button>
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/70 bg-amber-50/80 dark:bg-amber-950/40 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-200 space-y-1">
          {warnings.map((warning, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <AlertCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
