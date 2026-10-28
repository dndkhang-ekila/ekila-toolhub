'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Locale, LanguageContextType } from '@/types/language';
import { availableLocales, DEFAULT_LOCALE, translate } from '@/locales';

const LOCALE_STORAGE_KEY = 'toolhub_locale';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = useState(false);

  // Khởi tạo ngôn ngữ từ localStorage hoặc trình duyệt sau khi mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
        if (stored === 'vi' || stored === 'en') {
          setLocaleState(stored);
          document.documentElement.lang = stored;
        } else {
          // Kiểm tra navigator.language của người dùng
          const browserLang = navigator.language.toLowerCase();
          const detected: Locale = browserLang.startsWith('vi') ? 'vi' : 'en';
          setLocaleState(detected);
          document.documentElement.lang = detected;
        }
      } catch {
        setLocaleState(DEFAULT_LOCALE);
      }
      setMounted(true);
    }, 0);

    return () => clearTimeout(timer);
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

    // TODO: [FR-COM-05] Synchronize locale preference with backend API PATCH /api/v1/account/profile when user is authenticated
    // e.g., if (userToken) updateProfile({ locale: newLocale }).catch(...)
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
