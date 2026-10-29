'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { SparklesIcon, SunIcon, MoonIcon } from '@/components/ui/Icons';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    const timer = setTimeout(() => {
      setIsDark(isDarkMode);
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    const nextDark = !isCurrentlyDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 transition-transform group-hover:scale-105">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Tool<span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Hub</span>
              </span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-muted-foreground">
            <Link
              href="/"
              className="rounded-lg px-3 py-1.5 transition-colors hover:bg-muted hover:text-foreground"
            >
              Tiện ích
            </Link>
            <Link
              href="/tools/qr-generator"
              className="rounded-lg px-3 py-1.5 transition-colors hover:bg-muted hover:text-foreground"
            >
              Tạo QR
            </Link>
            <Link
              href="/tools/url-shortener"
              className="rounded-lg px-3 py-1.5 transition-colors hover:bg-muted hover:text-foreground"
            >
              Rút gọn link
            </Link>
            <Link
              href="/tools/image-compressor"
              className="rounded-lg px-3 py-1.5 transition-colors hover:bg-muted hover:text-foreground"
            >
              Nén ảnh
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Chuyển đổi giao diện sáng tối"
            title={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-xs transition-all duration-200 hover:border-primary/50 hover:bg-muted hover:text-foreground active:scale-95"
          >
            {mounted ? (
              isDark ? (
                <SunIcon className="h-4 w-4 text-amber-500 transition-transform duration-200" />
              ) : (
                <MoonIcon className="h-4 w-4 text-slate-700 dark:text-slate-200 transition-transform duration-200" />
              )
            ) : (
              <SunIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-xs font-medium text-muted-foreground">
                {user?.email}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-95"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
