'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { ShortenedLink } from '@/types/url';
import {
  clearShortenedLinks,
  getRecentShortenedLinks,
  removeShortenedLink,
} from '@/lib/url-shortener';
import { UrlShortenerForm } from './UrlShortenerForm';
import { ShortenedResultCard } from './ShortenedResultCard';
import { RecentLinksHistory } from './RecentLinksHistory';

export function UrlShortenerContainer() {
  const { t } = useLanguage();
  const [currentLink, setCurrentLink] = useState<ShortenedLink | null>(null);
  const [recentLinks, setRecentLinks] = useState<ShortenedLink[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRecentLinks(getRecentShortenedLinks());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleCreateSuccess = (newLink: ShortenedLink) => {
    setCurrentLink(newLink);
    setRecentLinks(getRecentShortenedLinks());
  };

  const handleDeleteItem = (id: string) => {
    const updated = removeShortenedLink(id);
    setRecentLinks(updated);
    if (currentLink?.id === id) {
      setCurrentLink(null);
    }
  };

  const handleClearAll = () => {
    clearShortenedLinks();
    setRecentLinks([]);
    setCurrentLink(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs">
          <span>⚡</span>
          <span>Công cụ rút gọn URL chuẩn nhận diện ToolHub</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          {t('urlShortener.pageTitle') || 'Rút gọn liên kết nhanh'}
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-neutral-500 dark:text-neutral-400">
          {t('urlShortener.pageSubtitle') ||
            'Biến những đường dẫn dài, phức tạp thành liên kết ngắn gọn, chuyên nghiệp và dễ nhớ'}
        </p>
      </div>

      {/* Main Input Form */}
      <UrlShortenerForm onSuccess={handleCreateSuccess} />

      {/* Result Card: Displayed right after shortening */}
      {currentLink && (
        <ShortenedResultCard
          link={currentLink}
          onReset={() => setCurrentLink(null)}
        />
      )}

      {/* Recent Links History */}
      <RecentLinksHistory
        links={recentLinks}
        onDelete={handleDeleteItem}
        onClear={handleClearAll}
      />

      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              An toàn liên kết &amp; Báo cáo vi phạm
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Phát hiện liên kết lừa đảo, mã độc hoặc spam? Gửi báo cáo để quản trị viên xử lý.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href="/links/report"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition"
          >
            Báo cáo link vi phạm
          </Link>
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
          >
            Hàng đợi kiểm duyệt
          </Link>
        </div>
      </div>
    </div>
  );
}
