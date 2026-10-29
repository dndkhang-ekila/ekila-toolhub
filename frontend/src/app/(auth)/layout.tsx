import React from 'react';
import Link from 'next/link';
import { ShieldCheckIcon } from '@/components/ui/Icons';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Header */}
      <header className="w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
              T
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50">
                Tool<span className="text-blue-600 dark:text-blue-400">Hub</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-zinc-400 border-l border-zinc-300 dark:border-zinc-700 pl-2">
                Tiện ích QRCode & Công cụ tệp
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            ← Về trang chủ
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6 sm:my-10">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/40 p-6 sm:p-8 backdrop-blur-sm">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800/80 py-6 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-2">
        <div className="flex items-center justify-center gap-1.5 text-zinc-500 dark:text-zinc-400">
          <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
          <span>Mã hoá an toàn theo tiêu chuẩn NFR-SEC-01/02</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Tuân thủ Nghị định 13/2023/NĐ-CP</span>
        </div>
        <p>© 2026 ToolHub. Bản quyền thuộc về đội ngũ phát triển.</p>
      </footer>
    </div>
  );
}
