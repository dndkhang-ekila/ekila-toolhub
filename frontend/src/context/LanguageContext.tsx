'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Locale, LanguageContextType } from '@/types/language';
import { availableLocales, DEFAULT_LOCALE, translate } from '@/locales';
import { LOCALE_STORAGE_KEY, LOCALE_CHANGED_EVENT, getLocale } from '@/lib/use-locale';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = useState(false);

  // Khởi tạo ngôn ngữ từ localStorage (mặc định 'vi' theo tiêu chuẩn)
  useEffect(() => {
    const timer = setTimeout(() => {
      const initialLocale = getLocale();
      setLocaleState(initialLocale);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = initialLocale;
      }
      setMounted(true);
    }, 0);

    const handleExternalChange = () => {
      const current = getLocale();
      setLocaleState(current);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = current;
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === LOCALE_STORAGE_KEY || event.key === null) {
        handleExternalChange();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(LOCALE_CHANGED_EVENT, handleExternalChange);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(LOCALE_CHANGED_EVENT, handleExternalChange);
    };
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale;
    }

    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      document.cookie = `${LOCALE_STORAGE_KEY}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignore
    }

    // Bắn event 'toolhub:locale-change' để đồng bộ toàn bộ app
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(LOCALE_CHANGED_EVENT));
      window.dispatchEvent(new CustomEvent(LOCALE_CHANGED_EVENT, { detail: newLocale }));
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      return translate(mounted ? locale : DEFAULT_LOCALE, key, params);
    },
    [locale, mounted],
  );

  return (
    <LanguageContext.Provider
      value={{
        locale: mounted ? locale : DEFAULT_LOCALE,
        setLocale,
        t,
        availableLocales,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
