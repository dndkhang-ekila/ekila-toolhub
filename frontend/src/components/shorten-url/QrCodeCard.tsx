'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useLanguage } from '@/context/LanguageContext';

interface QrCodeCardProps {
  url: string;
  slug: string;
  onClose?: () => void;
}

export function QrCodeCard({ url, slug, onClose }: QrCodeCardProps) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !url) return;

    QRCode.toCanvas(
      canvasRef.current,
      url,
      {
        width: 220,
        margin: 2,
        color: {
          dark: '#1e1b4b', // Deep indigo
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      },
      (error) => {
        if (!error && canvasRef.current) {
          try {
            setDownloadUrl(canvasRef.current.toDataURL('image/png'));
          } catch {
            // Ignore
          }
        }
      },
    );
  }, [url]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 shadow-md animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center relative">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng xem mã QR"
          className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 rounded-md"
        >
          ✕
        </button>
      )}

      {/* QR Canvas Container with sleek border & padding */}
      <div className="bg-white p-3.5 rounded-xl border border-neutral-100 shadow-inner flex items-center justify-center">
        <canvas ref={canvasRef} className="rounded-lg" />
      </div>

      {/* Short Link Display */}
      <div className="mt-3 text-center max-w-full px-2">
        <p className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 truncate">
          {url}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 w-full">
        {downloadUrl && (
          <a
            href={downloadUrl}
            download={`toolhub-qr-${slug}.png`}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>{t('urlShortener.downloadQr') || 'Tải mã QR (PNG)'}</span>
          </a>
        )}

        <button
          type="button"
          onClick={handleCopy}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 transition flex items-center gap-1.5"
        >
          {copied ? '✓ Đã chép' : '📋 Sao chép link'}
        </button>
      </div>
    </div>
  );
}
