import { vi, Translations } from './vi';
import { en } from './en';
import { Locale, LanguageOption } from '@/types/language';

export const locales: Record<Locale, Translations> = {
  vi,
  en,
};

export const availableLocales: LanguageOption[] = [
  {
    code: 'vi',
    label: 'Tiếng Việt',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
  },
  {
    code: 'en',
    label: 'English',
    nativeName: 'English (US)',
    flag: '🇬🇧',
  },
];

export const DEFAULT_LOCALE: Locale = 'vi';

/**
 * Lấy chuỗi bản dịch theo key phân cấp dạng dot-notation (ví dụ: 'nav.home', 'theme.dark')
 */
export function translate(
  locale: Locale,
  path: string,
  params?: Record<string, string | number>,
): string {
  const dict = locales[locale] || locales[DEFAULT_LOCALE];
  const keys = path.split('.');

  let current: unknown = dict;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = (current as Record<string, unknown>)[k];
    } else {
      // Fallback sang Tiếng Việt nếu key không tồn tại
      let fallbackCurrent: unknown = locales[DEFAULT_LOCALE];
      for (const fk of keys) {
        if (fallbackCurrent && typeof fallbackCurrent === 'object' && fk in fallbackCurrent) {
          fallbackCurrent = (fallbackCurrent as Record<string, unknown>)[fk];
        } else {
          return path;
        }
      }
      current = fallbackCurrent;
      break;
    }
  }

  if (typeof current !== 'string') {
    return path;
  }

  // Thay thế params dạng {param}
  if (params) {
    return Object.entries(params).reduce(
      (acc, [pKey, pVal]) => acc.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal)),
      current,
    );
  }

  return current;
}
