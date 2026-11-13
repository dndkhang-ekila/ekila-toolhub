'use client';

import React, { useEffect, useState } from 'react';
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
    </div>
  );
}
