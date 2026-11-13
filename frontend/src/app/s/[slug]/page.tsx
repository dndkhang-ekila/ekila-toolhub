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
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    if (!slug) {
      return;
    }

    resolveShortUrl(slug)
      .then((resolvedUrl) => {
        if (isCancelled) return;
        if (resolvedUrl) {
          setTargetUrl(resolvedUrl);
          // Tự động chuyển hướng đến URL gốc
          redirectTimer = setTimeout(() => {
            window.location.replace(resolvedUrl);
          }, 800);
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setChecking(false);
        }
      });

    return () => {
      isCancelled = true;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [slug]);

  if (checking && targetUrl) {
    return (
      <main className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
          Đang chuyển hướng đến liên kết gốc...
        </h2>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 font-mono max-w-md truncate">
          {targetUrl}
        </p>

        <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Báo cáo link vi phạm
          </button>
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

  if (checking) {
    return (
      <main className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-neutral-300 dark:border-neutral-700 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-neutral-500">Đang tìm liên kết rút gọn...</p>
      </main>
    );
  }

  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-3xl mb-4">
        🔍
      </div>
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
        Không tìm thấy liên kết rút gọn
      </h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
        Mã slug <code className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 font-mono font-bold">{slug}</code> không tồn tại hoặc đã hết hạn.
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
          targetUrl={targetUrl || undefined}
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
