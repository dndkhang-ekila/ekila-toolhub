'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon, SearchIcon } from '@/components/ui/Icons';
import { SetLinkPasswordCard } from '@/components/protected-link';

function SetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get('slug') || '';

  const handleSelectSlugToUnlock = (slug: string) => {
    router.push(`/protected-link/unlock-gate/${encodeURIComponent(slug)}`);
  };

  return (
    <SetLinkPasswordCard
      key={initialSlug}
      initialSlug={initialSlug}
      onSelectSlugToUnlock={handleSelectSlugToUnlock}
    />
  );
}

export default function SetPasswordPage() {
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
            href="/protected-link/unlock-gate"
            className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <SearchIcon className="w-3.5 h-3.5" />
            <span>Tra cứu &amp; Mở khóa</span>
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm text-center text-xs text-neutral-400">
              Đang tải biểu mẫu...
            </div>
          }
        >
          <SetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
