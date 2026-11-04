export type Locale = 'vi' | 'en';

export interface LanguageOption {
  code: Locale;
  label: string;
  nativeName: string;
  flag: string;
}

export interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  availableLocales: LanguageOption[];
}
