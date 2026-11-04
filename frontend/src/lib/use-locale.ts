'use client';

import { useSyncExternalStore } from 'react';

export type Locale = 'vi' | 'en';

export const LOCALE_STORAGE_KEY = 'toolhub_locale';
export const LOCALE_CHANGED_EVENT = 'toolhub:locale-change';
export const DEFAULT_LOCALE: Locale = 'vi';

export function getLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved === 'vi' || saved === 'en') return saved;
    return DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  const handleStorage = (event: StorageEvent) => {
    if (event.key === LOCALE_STORAGE_KEY || event.key === null) onStoreChange();
  };
  window.addEventListener('storage', handleStorage);
  window.addEventListener(LOCALE_CHANGED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(LOCALE_CHANGED_EVENT, onStoreChange);
  };
}

/**
 * Hook useLocale thống nhất cho toàn bộ hệ thống ToolHub.
 * Đọc trực tiếp từ localStorage key 'toolhub_locale', lắng nghe event 'toolhub:locale-change'
 * và fallback mặc định là 'vi' theo đúng tiêu chuẩn.
 */
export function useLocale(): Locale {
  return useSyncExternalStore(
    subscribe,
    getLocale,
    () => DEFAULT_LOCALE,
  );
}
