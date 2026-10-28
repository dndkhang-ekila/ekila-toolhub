'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Theme, ResolvedTheme, ThemeContextType } from '@/types/theme';

const THEME_STORAGE_KEY = 'toolhub_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

function applyThemeToDocument(resolved: ResolvedTheme, rawTheme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (resolved === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }

  root.setAttribute('data-theme', resolved);

  // Lưu cookie để hỗ trợ SSR / Middleware nếu cần
  try {
    document.cookie = `${THEME_STORAGE_KEY}=${rawTheme}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    // Ignore in restrictive cookie environments
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [mounted, setMounted] = useState(false);

  // Khởi tạo theme từ localStorage sau khi mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
        const initialTheme: Theme =
          storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system'
            ? storedTheme
            : 'system';

        const initialResolved = resolveTheme(initialTheme);
        setThemeState(initialTheme);
        setResolvedTheme(initialResolved);
        applyThemeToDocument(initialResolved, initialTheme);
      } catch {
        // Fallback
        const initialResolved = getSystemTheme();
        setResolvedTheme(initialResolved);
        applyThemeToDocument(initialResolved, 'system');
      }
      setMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Lắng nghe thay đổi prefers-color-scheme từ hệ điều hành
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (theme === 'system') {
        const newResolved = mediaQuery.matches ? 'dark' : 'light';
        setResolvedTheme(newResolved);
        applyThemeToDocument(newResolved, 'system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    const resolved = resolveTheme(newTheme);
    setResolvedTheme(resolved);
    applyThemeToDocument(resolved, newTheme);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignore quota errors
    }

    // TODO: [FR-COM-05] Synchronize theme preference with backend user settings endpoint when user is authenticated
    // e.g., if (user) api.patch('/api/v1/account/preferences', { theme: newTheme }).catch(...)
  }, []);

  const toggleTheme = useCallback(() => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme: mounted ? resolvedTheme : 'light',
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Script inline chống giật màn hình (Anti-FOUC) chèn vào thẻ <head>
 */
export const antiFoucScript = `
(function() {
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var theme = (stored === 'light' || stored === 'dark' || stored === 'system') ? stored : 'system';
    var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  } catch (e) {}
})();
`;
