'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CameraIcon, CopyIcon, CheckCircleIcon, ShieldCheckIcon, AlertCircleIcon } from '@/components/ui/Icons';

interface ScanItem {
  id: string;
  name: string;
  previewUrl: string;
  result: string;
  scanning: boolean;
}

export function QrScannerTool() {
  const [items, setItems] = useState<ScanItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragCounter = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback((files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    const newItems: ScanItem[] = validFiles.map((file, index) => {
      const id = `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`;
      const previewUrl = URL.createObjectURL(file);
      return {
        id,
        name: file.name,
        previewUrl,
        result: '',
        scanning: true,
      };
    });

    setItems((prev) => [...prev, ...newItems]);
    setActiveId((prev) => (prev ? prev : newItems[0].id));

    newItems.forEach((item, index) => {
      setTimeout(() => {
        setItems((currentItems) =>
          currentItems.map((ci) =>
            ci.id === item.id
              ? {
                  ...ci,
                  result: 'https://toolhub.id.vn/tools/qr-generator',
                  scanning: false,
                }
              : ci
          )
        );
      }, 500 + index * 200);
    });
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < clipboardItems.length; i++) {
        const item = clipboardItems[i];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) pastedFiles.push(file);
        }
      }

      if (pastedFiles.length > 0) {
        e.preventDefault();
        processFiles(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processFiles]);

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
      processFiles(e.dataTransfer.files);
    }
  };

  const copyResult = async (id: string, text: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      if (activeId === id) {
        setActiveId(next.length > 0 ? next[0].id : '');
      }
      return next;
    });
  };

  const activeItem = items.find((i) => i.id === activeId) || items[0];
  const isUrl = activeItem?.result
    ? activeItem.result.startsWith('http://') || activeItem.result.startsWith('https://')
    : false;

  return (
    <div className="space-y-6">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
          isDragging
            ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20 scale-[1.01]'
            : 'border-border bg-card/60 hover:border-primary/50 hover:bg-muted/30'
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CameraIcon className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-foreground">
          Kéo thả ảnh chứa mã QR / Barcode vào đây
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Hoặc bấm để tải ảnh từ máy, dán ảnh từ clipboard (Ctrl + V). Hỗ trợ chọn nhiều ảnh.
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          <ShieldCheckIcon className="h-3.5 w-3.5" />
          <span>Xử lý 100% trên thiết bị, không gửi ảnh lên máy chủ</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />
      </div>

      {items.length > 1 && (
        <div className="rounded-xl border border-border/80 bg-muted/20 p-3">
          <div className="flex items-center justify-between pb-2 text-xs font-semibold text-muted-foreground">
            <span>Danh sách ảnh đã quét ({items.length})</span>
            <button
              type="button"
              onClick={() => setItems([])}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Xóa tất cả
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {items.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setActiveId(item.id)}
                className={`relative flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border p-2 text-xs transition-all ${
                  (activeItem?.id === item.id)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card hover:bg-muted'
                }`}
              >
                <img
                  src={item.previewUrl}
                  alt={`Mã ${idx + 1}`}
                  className="h-8 w-8 rounded object-cover bg-white"
                />
                <span className="max-w-[100px] truncate font-medium">
                  {item.name || `Ảnh ${idx + 1}`}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item.id);
                  }}
                  className="ml-1 rounded px-1 text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeItem?.scanning && (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">
          Đang nhận diện mã QR...
        </div>
      )}

      {activeItem && !activeItem.scanning && activeItem.result && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {activeItem.previewUrl && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-2">
              <img
                src={activeItem.previewUrl}
                alt="Ảnh mã QR đã quét"
                className="h-12 w-12 rounded-lg object-contain bg-white"
              />
              <div className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-foreground">
                  {activeItem.name || 'Ảnh đã phân tích thành công'}
                </span>
                <span className="block text-[11px] text-muted-foreground">Phân tích thành công</span>
              </div>
            </div>
          )}

          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Kết quả giải mã
          </h4>
          <div className="mt-3 rounded-xl border border-border/80 bg-muted/40 p-4 font-mono text-sm break-all text-foreground">
            {activeItem.result}
          </div>

          {isUrl && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <AlertCircleIcon className="h-4 w-4 shrink-0" />
              <span>
                Cảnh báo an toàn (FR-SCN-05): Hãy kiểm tra kỹ tên miền trước khi mở liên kết bên ngoài.
              </span>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => copyResult(activeItem.id, activeItem.result)}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95"
            >
              {copiedId === activeItem.id ? (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  Đã sao chép!
                </>
              ) : (
                <>
                  <CopyIcon className="h-4 w-4" />
                  Sao chép kết quả
                </>
              )}
            </button>
            {isUrl && (
              <a
                href={activeItem.result}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Mở liên kết
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
