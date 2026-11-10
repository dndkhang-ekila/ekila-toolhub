'use client';

import { useEffect, useState, use, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { resolveSlug } from '@/lib/link-api';

function RedirectHandler({
  paramsPromise,
}: {
  paramsPromise: Promise<{ slug: string }>;
}) {
  const { slug } = use(paramsPromise);
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    resolveSlug(slug)
      .then((res) => {
        if (!isMounted) return;

        if (res.status === 'SUCCESS' && res.originalUrl) {
          window.location.replace(res.originalUrl);
        } else {
          router.replace(
            `/links/notice?slug=${encodeURIComponent(slug)}&status=${res.status.toLowerCase()}`,
          );
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setErrorMsg('Không thể kết nối tới máy chủ rút gọn liên kết.');
      });

    return () => {
      isMounted = false;
    };
  }, [slug, router]);

  return (
    <div className="p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl max-w-sm w-full space-y-4">
      {errorMsg ? (
        <div className="space-y-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
            {errorMsg}
          </p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white"
          >
            Về trang chủ
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            Đang chuyển hướng...
          </h2>
          <p className="text-xs text-neutral-400">
            Bạn đang được chuyển tới URL đích cho mã link{' '}
            <span className="font-mono font-bold">/{slug}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default function ShortRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 text-center">
      <Suspense
        fallback={
          <div className="p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl max-w-sm w-full space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Đang tải...
            </h2>
          </div>
        }
      >
        <RedirectHandler paramsPromise={params} />
      </Suspense>
    </main>
  );
}
