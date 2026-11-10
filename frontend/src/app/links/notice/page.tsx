'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function NoticeContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') || '';
  const status = (searchParams.get('status') || 'not_found').toLowerCase();

  let title = 'Liên kết không tồn tại';
  let description =
    'Liên kết rút gọn này không tồn tại hoặc đã bị xóa khỏi hệ thống.';
  let iconBg = 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800';
  let iconType = 'cross';

  if (status === 'disabled') {
    title = 'Liên kết tạm thời bị vô hiệu hoá';
    description =
      'Chủ sở hữu của liên kết này đã chủ động tắt trạng thái hoạt động. Vui lòng liên hệ người chia sẻ liên kết.';
    iconBg = 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    iconType = 'pause';
  } else if (status === 'expired') {
    title = 'Liên kết đã hết hạn truy cập';
    description =
      'Liên kết rút gọn này đã vượt quá thời hạn hoạt động được thiết lập ban đầu.';
    iconBg = 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800';
    iconType = 'clock';
  }

  return (
    <div className="max-w-md w-full mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl text-center space-y-6">
      <div
        className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border shadow-sm ${iconBg}`}
      >
        {iconType === 'cross' && (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {iconType === 'pause' && (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {iconType === 'clock' && (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>

      <div className="space-y-2">
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
          {title}
        </h1>
        {slug && (
          <p className="text-xs font-mono px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg inline-block text-neutral-600 dark:text-neutral-400">
            Mã link: /{slug}
          </p>
        )}
        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          Về trang chủ
        </Link>
        <Link
          href="/links"
          className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          Quản lý liên kết
        </Link>
      </div>
    </div>
  );
}

export default function LinkNoticePage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-950">
      <Suspense
        fallback={
          <div className="text-center text-sm text-neutral-400 py-12">
            Đang tải thông báo...
          </div>
        }
      >
        <NoticeContent />
      </Suspense>
    </main>
  );
}
