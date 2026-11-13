'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImageIcon, DownloadIcon, SparklesIcon } from '@/components/ui/Icons';

interface ImageItem {
  id: string;
  file: File;
  originalUrl: string;
  originalSize: number;
  compressedUrl: string;
  compressedSize: number;
  isCompressing: boolean;
}

export function ImageCompressorTool() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [quality, setQuality] = useState<number>(0.75);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragCounter = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const compressSingleFile = useCallback(
    (file: File, q: number): Promise<{ compressedUrl: string; compressedSize: number }> => {
      return new Promise((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ compressedUrl: objectUrl, compressedSize: file.size });
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({
                  compressedUrl: URL.createObjectURL(blob),
                  compressedSize: blob.size,
                });
              } else {
                resolve({ compressedUrl: objectUrl, compressedSize: file.size });
              }
            },
            'image/jpeg',
            q
          );
        };
        img.onerror = () => {
          resolve({ compressedUrl: objectUrl, compressedSize: file.size });
        };
      });
    },
    []
  );

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const validFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
      if (validFiles.length === 0) return;

      const newItems: ImageItem[] = validFiles.map((file, idx) => ({
        id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        originalUrl: URL.createObjectURL(file),
        originalSize: file.size,
        compressedUrl: '',
        compressedSize: 0,
        isCompressing: true,
      }));

      setItems((prev) => [...prev, ...newItems]);

      for (const item of newItems) {
        const result = await compressSingleFile(item.file, quality);
        setItems((current) =>
          current.map((ci) =>
            ci.id === item.id
              ? {
                  ...ci,
                  compressedUrl: result.compressedUrl,
                  compressedSize: result.compressedSize,
                  isCompressing: false,
                }
              : ci
          )
        );
      }
    },
    [compressSingleFile, quality]
  );

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

  const handleQualityChange = async (newQ: number) => {
    setQuality(newQ);
    if (items.length === 0) return;

    setItems((prev) => prev.map((item) => ({ ...item, isCompressing: true })));

    for (const item of items) {
      const result = await compressSingleFile(item.file, newQ);
      setItems((current) =>
        current.map((ci) =>
          ci.id === item.id
            ? {
                ...ci,
                compressedUrl: result.compressedUrl,
                compressedSize: result.compressedSize,
                isCompressing: false,
              }
            : ci
        )
      );
    }
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (selectedIndex >= next.length) {
        setSelectedIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  const downloadAll = () => {
    items.forEach((item, index) => {
      if (!item.compressedUrl) return;
      setTimeout(() => {
        const link = document.createElement('a');
        link.download = `compressed_${item.file.name}`;
        link.href = item.compressedUrl;
        link.click();
      }, index * 200);
    });
  };

  const activeItem = items[selectedIndex] || items[0];
  const percentReduced =
    activeItem && activeItem.originalSize > 0 && activeItem.compressedSize > 0
      ? Math.max(0, Math.round(((activeItem.originalSize - activeItem.compressedSize) / activeItem.originalSize) * 100))
      : 0;

  return (
    <div className="space-y-6">
      {items.length === 0 ? (
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
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ImageIcon className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-foreground">
            Kéo thả ảnh vào đây, hoặc bấm để duyệt tệp
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Hỗ trợ chọn nhiều ảnh, dán từ clipboard (Ctrl + V). Định dạng JPG, PNG, WebP (Tối đa 25MB)
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
            <SparklesIcon className="h-3.5 w-3.5" />
            Xử lý trực tiếp trên trình duyệt bằng Canvas / WebAssembly
          </span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
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
        <div className="space-y-6">
          {items.length > 1 && (
            <div className="rounded-xl border border-border/80 bg-muted/20 p-3">
              <div className="flex items-center justify-between pb-2 text-xs font-semibold text-muted-foreground">
                <span>Danh sách ảnh ({items.length})</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary hover:underline"
                  >
                    + Thêm ảnh
                  </button>
                  <button
                    type="button"
                    onClick={() => setItems([])}
                    className="hover:text-foreground"
                  >
                    Xóa tất cả
                  </button>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedIndex(idx)}
                    className={`relative flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border p-2 text-xs transition-all ${
                      selectedIndex === idx
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card hover:bg-muted'
                    }`}
                  >
                    <img
                      src={item.originalUrl}
                      alt={item.file.name}
                      className="h-8 w-8 rounded object-cover bg-white"
                    />
                    <div className="max-w-[100px] truncate">
                      <span className="block truncate font-medium">{item.file.name}</span>
                      <span className="text-[10px] text-muted-foreground">{formatBytes(item.originalSize)}</span>
                    </div>
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

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Điều chỉnh mức nén
                </span>
                <div className="mt-2 flex gap-2">
                  {[
                    { label: 'Nhẹ (85%)', val: 0.85 },
                    { label: 'Cân bằng (70%)', val: 0.7 },
                    { label: 'Mạnh (50%)', val: 0.5 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleQualityChange(p.val)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        quality === p.val
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Thêm ảnh khác
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      addFiles(e.target.files);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>

            {activeItem && (
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                  <span className="text-xs font-medium text-muted-foreground">
                    Ảnh gốc ({activeItem.file.name})
                  </span>
                  <div className="mt-2 flex h-52 items-center justify-center overflow-hidden rounded-lg bg-card">
                    <img src={activeItem.originalUrl} alt="Original" className="h-full w-full object-contain" />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Dung lượng gốc:</span>
                    <span className="font-semibold text-foreground">{formatBytes(activeItem.originalSize)}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Ảnh sau khi nén
                  </span>
                  <div className="mt-2 flex h-52 items-center justify-center overflow-hidden rounded-lg bg-card">
                    {activeItem.isCompressing ? (
                      <span className="text-xs text-muted-foreground">Đang xử lý nén...</span>
                    ) : (
                      <img src={activeItem.compressedUrl} alt="Compressed" className="h-full w-full object-contain" />
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Dung lượng mới:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {formatBytes(activeItem.compressedSize)}
                      </span>
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
                        -{percentReduced}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={downloadAll}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition-all hover:bg-muted"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Tải tất cả ({items.length} ảnh)
                </button>
              )}
              {activeItem && (
                <a
                  href={activeItem.compressedUrl}
                  download={`compressed_${activeItem.file.name}`}
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-95"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Tải ảnh nén về máy ({formatBytes(activeItem.compressedSize)})
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
