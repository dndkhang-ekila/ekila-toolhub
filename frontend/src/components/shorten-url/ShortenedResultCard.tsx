'use client';

import React, { useState } from 'react';
import { ShortenedLink } from '@/types/url';
import { useLanguage } from '@/context/LanguageContext';
import { QrCodeCard } from './QrCodeCard';
import { ShareModal } from './ShareModal';

interface ShortenedResultCardProps {
  link: ShortenedLink;
  onReset?: () => void;
}

export function ShortenedResultCard({ link, onReset }: ShortenedResultCardProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // [FR-URL-05] Nút sao chép
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = link.shortUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // [FR-URL-05] Nút chia sẻ (hỗ trợ Web Share API hoặc Modal)
  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'ToolHub Short Link',
          text: `Liên kết rút gọn: ${link.shortUrl}`,
          url: link.shortUrl,
        });
        return;
      } catch {
        // User cancelled or share failed, fallback to modal
      }
    }
    setShowShareModal(true);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border-2 border-indigo-500/30 dark:border-indigo-500/40 rounded-2xl p-6 sm:p-7 shadow-lg shadow-indigo-500/5 relative animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Top Banner / Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            {t('urlShortener.resultTitle') || 'Liên kết ngắn của bạn đã sẵn sàng!'}
          </h3>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          Slug: {link.slug} ({link.slug.length} ký tự)
        </span>
      </div>

      {/* Main Short URL presentation */}
      <div className="mt-5 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-xs uppercase font-semibold text-neutral-400 dark:text-neutral-500 tracking-wider mb-1">
            {t('urlShortener.shortUrl') || 'Liên kết rút gọn'}
          </p>
          <a
            href={link.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg sm:text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 hover:underline truncate block"
          >
            {link.shortUrl}
          </a>
        </div>

        {/* Primary Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          className={`px-5 py-3 rounded-xl font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 shrink-0 ${
            copied
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 active:scale-95'
          }`}
        >
          {copied ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{t('urlShortener.copiedBtn') || 'Đã sao chép!'}</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span>{t('urlShortener.copyBtn') || 'Sao chép link'}</span>
            </>
          )}
        </button>
      </div>

      {/* Original URL Preview */}
      <div className="mt-3 px-1 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
        <span className="font-semibold shrink-0">{t('urlShortener.originalUrl') || 'Đường dẫn gốc'}:</span>
        <a
          href={link.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-neutral-600 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 underline"
        >
          {link.originalUrl}
        </a>
      </div>

      {/* [FR-URL-05] Action Toolbar */}
      <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Nút Tạo mã QR */}
          <button
            type="button"
            onClick={() => setShowQr(!showQr)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
              showQr
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700/80'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
            <span>
              {showQr
                ? t('urlShortener.hideQrBtn') || 'Ẩn mã QR'
                : t('urlShortener.qrBtn') || 'Tạo mã QR'}
            </span>
          </button>

          {/* Nút Chia sẻ */}
          <button
            type="button"
            onClick={handleShare}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700/80 transition flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <span>{t('urlShortener.shareBtn') || 'Chia sẻ'}</span>
          </button>

          {/* Nút Mở link trực tiếp */}
          <a
            href={link.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700/80 transition flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            <span>{t('urlShortener.visitBtn') || 'Mở liên kết'}</span>
          </a>
        </div>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium py-1"
          >
            + Rút gọn link khác
          </button>
        )}
      </div>

      {/* Expandable QR Code Component */}
      {showQr && (
        <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-center">
          <QrCodeCard
            url={link.shortUrl}
            slug={link.slug}
            onClose={() => setShowQr(false)}
          />
        </div>
      )}

      {/* Share Modal Fallback */}
      <ShareModal
        isOpen={showShareModal}
        shortUrl={link.shortUrl}
        originalUrl={link.originalUrl}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
}
