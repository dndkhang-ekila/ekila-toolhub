import React from 'react';

import { ShieldCheckIcon } from '@/components/ui/Icons';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">

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
