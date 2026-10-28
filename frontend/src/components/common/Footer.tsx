'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';

export function Footer() {
  const { t, locale } = useLanguage();
  const { theme, resolvedTheme } = useTheme();

  return (
    <footer className="w-full border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-8 transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm text-neutral-900 dark:text-white">ToolHub</span>
          <span className="text-neutral-300 dark:text-neutral-700">|</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {t('footer.copyright')}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{locale === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}</span>
            <span className="text-neutral-300 dark:text-neutral-600">•</span>
            <span className="capitalize">
              {theme === 'system'
                ? `${t('theme.system')} (${resolvedTheme})`
                : resolvedTheme === 'dark'
                ? t('theme.dark')
                : t('theme.light')}
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
