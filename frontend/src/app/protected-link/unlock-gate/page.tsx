'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@/components/ui/Icons';
import { LinkSearchUnlock } from '@/components/protected-link';
import { KeyIcon } from '@/components/protected-link/ProtectedLinkIcons';

export default function UnlockGatePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-100/80 dark:bg-neutral-950 py-10 px-4 sm:px-6 transition-colors duration-200">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs">
          <Link
            href="/protected-link"
            className="inline-flex items-center gap-1.5 font-semibold text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Trang Bảo mật link</span>
          </Link>

          <Link
            href="/protected-link/set-password"
            className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <KeyIcon className="w-3.5 h-3.5" />
            <span>Đặt mật khẩu link</span>
          </Link>
        </div>

        {/* Component Tìm kiếm & Mở khóa */}
        <LinkSearchUnlock />
      </div>
    </div>
  );
}
