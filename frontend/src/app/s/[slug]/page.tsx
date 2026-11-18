'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { resolveShortUrl } from '@/lib/url-shortener';
import { ReportAbuseModal } from '@/components/links/ReportAbuseModal';

function ShortUrlRedirectContent() {
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : '';

  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [checking, setChecking] = useState(Boolean(slug));
  const [countdown, setCountdown] = useState(5);
  const [isPaused, setIsPaused] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    if (!slug) {
      return;
    }

    resolveShortUrl(slug)
      .then((resolvedUrl) => {
        if (isCancelled) return;
        if (resolvedUrl) {
          setTargetUrl(resolvedUrl);
        }
        setChecking(false);
      })
      .catch(() => {
        if (!isCancelled) {
          setChecking(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!targetUrl || isPaused || showReportModal) {
      return;
    }

    if (countdown <= 0) {
      window.location.replace(targetUrl);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [targetUrl, countdown, isPaused, showReportModal]);

  const handleOpenReport = () => {
    setIsPaused(true);
    setShowReportModal(true);
  };

  if (checking) {
    return (
      <main className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-neutral-300 dark:border-neutral-700 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-neutral-500">
          Đang kiểm tra liên kết rút gọn...
        </p>
      </main>
    );
  }

  if (targetUrl) {
    return (
      <main className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-lg w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-center mx-auto">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
              Bạn sắp rời khỏi ToolHub
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {isPaused
                ? 'Đã tạm dừng tự động chuyển hướng.'
                : `Tự động chuyển hướng sau ${countdown} giây...`}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 text-left space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Đích đến của /{slug}
            </div>
            <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 break-all">
              {targetUrl}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => window.location.replace(targetUrl)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm"
            >
              Tiếp tục truy cập ngay
            </button>
            <button
              type="button"
              onClick={handleOpenReport}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Báo cáo link vi phạm
            </button>
          </div>
        </div>

        {slug && (
          <ReportAbuseModal
            slug={slug}
            targetUrl={targetUrl}
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
          />
        )}
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center mb-4">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
        Liên kết không tồn tại hoặc đã bị vô hiệu hoá
      </h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
        Mã slug{' '}
        <code className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 font-mono font-bold">
          /{slug}
        </code>{' '}
        không tồn tại, đã hết hạn hoặc đã bị quản trị viên khóa do vi phạm chính sách.
      </p>

      <div className="mt-6 flex items-center justify-center gap-3">
        <Link
          href="/shorten-url"
          className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm"
        >
          Tạo liên kết mới
        </Link>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl font-semibold text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
        >
          Trang chủ
        </Link>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowReportModal(true)}
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Báo cáo link này nếu có vi phạm
        </button>
      </div>

      {slug && (
        <ReportAbuseModal
          slug={slug}
          targetUrl={undefined}
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </main>
  );
}

export default function ShortUrlRedirectPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-10 h-10 border-4 border-neutral-300 dark:border-neutral-700 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-neutral-500">Đang tải...</p>
        </main>
      }
    >
      <ShortUrlRedirectContent />
    </Suspense>
  );
}
