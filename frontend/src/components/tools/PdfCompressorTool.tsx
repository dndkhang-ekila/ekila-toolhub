'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DocumentIcon, DownloadIcon, CheckCircleIcon, SparklesIcon } from '@/components/ui/Icons';

export function PdfCompressorTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [level, setLevel] = useState<'light' | 'balanced' | 'strong'>('balanced');
  const [compressing, setCompressing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [compressed, setCompressed] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragCounter = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const validFiles = Array.from(newFiles).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    if (validFiles.length === 0) return;

    setFiles((prev) => [...prev, ...validFiles]);
    setCompressed(false);
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < clipboardItems.length; i++) {
        const item = clipboardItems[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
            pastedFiles.push(file);
          }
        }
      }

      if (pastedFiles.length > 0) {
        e.preventDefault();
        addFiles(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [addFiles]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
    setCompressed(false);
  };

  const handleCompress = () => {
    if (files.length === 0) return;
    setCompressing(true);
    setProgress(15);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(timer);
          setCompressing(false);
          setCompressed(true);
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  const formatSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return (bytes / 1024).toFixed(1) + ' KB';
    return mb.toFixed(2) + ' MB';
  };

  const totalOriginalBytes = files.reduce((acc, curr) => acc + curr.size, 0);
  const reductionRatio = level === 'light' ? 0.3 : level === 'balanced' ? 0.55 : 0.72;
  const totalEstimatedNewBytes = Math.round(totalOriginalBytes * (1 - reductionRatio));

  const downloadFile = (file: File) => {
    const blob = new Blob(['Mock compressed PDF content'], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed_${file.name}`;
    a.click();
  };

  const downloadAll = () => {
    files.forEach((file, index) => {
      setTimeout(() => {
        downloadFile(file);
      }, index * 200);
    });
  };

  return (
    <div className="space-y-6">
      {files.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
            isDragging
              ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20 scale-[1.01]'
              : 'border-border bg-card/60 hover:border-primary/50 hover:bg-muted/30'
          }`}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <DocumentIcon className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-foreground">
            Kéo thả tệp PDF vào đây để nén
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Hỗ trợ chọn nhiều file PDF, dán từ clipboard (Ctrl + V). Tối đa 50MB mỗi tệp.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-medium text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
            <SparklesIcon className="h-3.5 w-3.5" />
            Tự động xóa file sau 1 giờ theo chuẩn bảo mật NFR-PRI-02
          </span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                addFiles(e.target.files);
                e.target.value = '';
              }
            }}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
                <DocumentIcon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground truncate max-w-xs sm:max-w-md">
                  {files.length === 1 ? files[0].name : `${files.length} tệp PDF đã chọn`}
                </h4>
                <p className="text-xs text-muted-foreground">{formatSize(totalOriginalBytes)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-primary hover:underline"
              >
                + Thêm PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  setFiles([]);
                  setCompressed(false);
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Xóa tất cả
              </button>
            </div>
          </div>

          {files.length > 1 && (
            <div className="max-h-48 overflow-y-auto divide-y divide-border/60 rounded-xl border border-border/80 bg-muted/20">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <DocumentIcon className="h-4 w-4 shrink-0 text-rose-500" />
                    <span className="truncate font-medium">{file.name}</span>
                    <span className="text-muted-foreground">({formatSize(file.size)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="ml-2 rounded px-1.5 py-0.5 text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                addFiles(e.target.files);
                e.target.value = '';
              }
            }}
          />

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Chọn mức độ nén
            </label>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { id: 'light', name: 'Nén nhẹ', desc: 'Giữ tối đa chất lượng bản in (~30% giảm)' },
                { id: 'balanced', name: 'Cân bằng', desc: 'Tối ưu xem màn hình & email (~55% giảm)' },
                { id: 'strong', name: 'Siêu nén', desc: 'Dung lượng nhỏ nhất (~70% giảm)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLevel(opt.id as typeof level)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    level === opt.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border bg-card hover:bg-muted/40'
                  }`}
                >
                  <span className="block text-xs font-semibold text-foreground">{opt.name}</span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {compressing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-foreground">
                <span>Đang xử lý nén tài liệu...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {!compressed && !compressing && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCompress}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95"
              >
                <SparklesIcon className="h-4 w-4" />
                {files.length > 1 ? `Bắt đầu nén ${files.length} tệp PDF` : 'Bắt đầu nén PDF'}
              </button>
            </div>
          )}

          {compressed && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>Nén tài liệu PDF thành công!</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Từ <span className="font-medium text-foreground">{formatSize(totalOriginalBytes)}</span> giảm xuống còn{' '}
                    <span className="font-semibold text-foreground">{formatSize(totalEstimatedNewBytes)}</span> (-
                    {Math.round(reductionRatio * 100)}%)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {files.length > 1 ? (
                    <button
                      type="button"
                      onClick={downloadAll}
                      className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95"
                    >
                      <DownloadIcon className="h-4 w-4" />
                      Tải tất cả ({files.length} PDF)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => downloadFile(files[0])}
                      className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95"
                    >
                      <DownloadIcon className="h-4 w-4" />
                      Tải file PDF đã nén
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
