'use client';

import React, { useState } from 'react';
import { ShortenedLink } from '@/types/url';
import { useLanguage } from '@/context/LanguageContext';
import { QrCodeCard } from './QrCodeCard';
import { ShareModal } from './ShareModal';

interface RecentLinksHistoryProps {
  links: ShortenedLink[];
  onDelete: (id: string) => void;
  onClear: () => void;
}

export function RecentLinksHistory({ links, onDelete, onClear }: RecentLinksHistoryProps) {
  const { t } = useLanguage();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeQrLink, setActiveQrLink] = useState<ShortenedLink | null>(null);
  const [activeShareLink, setActiveShareLink] = useState<ShortenedLink | null>(null);

  const handleCopy = async (link: ShortenedLink) => {
    try {
      await navigator.clipboard.writeText(link.shortUrl);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShare = async (link: ShortenedLink) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'ToolHub Short Link',
          text: `Liên kết rút gọn: ${link.shortUrl}`,
          url: link.shortUrl,
        });
        return;
      } catch {
        // Fallback to modal
      }
    }
    setActiveShareLink(link);
  };

  if (!links || links.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 mx-auto flex items-center justify-center text-xl mb-3">
          📂
        </div>
        <h4 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
          {t('urlShortener.recentTitle') || 'Lịch sử liên kết gần đây'}
        </h4>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
          {t('urlShortener.recentEmpty') ||
            'Chưa có liên kết nào được rút gọn. Hãy thử tạo liên kết đầu tiên ở trên!'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <h4 className="text-lg font-bold text-neutral-900 dark:text-white">
            {t('urlShortener.recentTitle') || 'Lịch sử liên kết gần đây'}
          </h4>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
            {links.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm(t('urlShortener.clearHistoryConfirm') || 'Bạn có chắc muốn xoá toàn bộ lịch sử?')) {
              onClear();
            }
          }}
          className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 hover:underline transition"
        >
          {t('urlShortener.clearHistory') || 'Xoá lịch sử'}
        </button>
      </div>

      {/* List */}
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {links.map((item) => {
          const isCopied = copiedId === item.id;
          const isQrOpen = activeQrLink?.id === item.id;

          return (
            <div key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <a
                      href={item.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                    >
                      {item.shortUrl}
                    </a>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      {item.slug}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-xl">
                    {item.originalUrl}
                  </p>
                </div>

                {/* Actions per item */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={() => handleCopy(item)}
                    title="Sao chép liên kết"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                      isCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {isCopied ? '✓ Đã chép' : '📋 Sao chép'}
                  </button>

                  {/* QR Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setActiveQrLink(isQrOpen ? null : item)}
                    title="Xem mã QR"
                    className={`p-1.5 rounded-lg text-xs border transition ${
                      isQrOpen
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent'
                        : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    📱
                  </button>

                  {/* Share Button */}
                  <button
                    type="button"
                    onClick={() => handleShare(item)}
                    title="Chia sẻ"
                    className="p-1.5 rounded-lg text-xs border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition"
                  >
                    🔗
                  </button>

                  {/* Open Link */}
                  <a
                    href={item.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Mở liên kết"
                    className="p-1.5 rounded-lg text-xs border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition"
                  >
                    ↗
                  </a>

                  {/* Delete Item */}
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    title="Xoá khỏi lịch sử"
                    className="p-1.5 rounded-lg text-xs text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Collapsible QR Code view */}
              {isQrOpen && (
                <div className="pt-2 flex justify-center animate-in fade-in duration-150">
                  <QrCodeCard
                    url={item.shortUrl}
                    slug={item.slug}
                    onClose={() => setActiveQrLink(null)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {activeShareLink && (
        <ShareModal
          isOpen={!!activeShareLink}
          shortUrl={activeShareLink.shortUrl}
          originalUrl={activeShareLink.originalUrl}
          onClose={() => setActiveShareLink(null)}
        />
      )}
    </div>
  );
}
