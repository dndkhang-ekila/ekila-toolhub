'use client';

import React, { use, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LockIcon, SearchIcon } from '@/components/ui/Icons';
import { ProtectedLinkGate } from '@/components/protected-link';
import { normalizeSlug, protectedLinkStorage } from '@/lib/protected-link-storage';
import {
  lookupLinkWithoutTracking,
  trackUnlockAndResolveTarget,
} from '@/lib/protected-link-service';
import { KeyIcon, UnlockIcon } from '@/components/protected-link/ProtectedLinkIcons';

function ProtectedSlugContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ slug: string }>;
}) {
  const { slug } = use(paramsPromise);
  const searchParams = useSearchParams();
  const pwQuery = searchParams.get('pw') || '';
  const cleanSlug = normalizeSlug(slug);
  const [status, setStatus] = useState<'checking' | 'locked' | 'unlocked' | 'public' | 'not_found'>('checking');
  const [destinationUrl, setDestinationUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (!isMounted) return;
      const isProtected = protectedLinkStorage.isProtected(cleanSlug);
      if (isProtected) {
        const meta = protectedLinkStorage.getMeta(cleanSlug);
        setDestinationUrl(meta?.originalUrl || null);
        setStatus('locked');
      } else {
        lookupLinkWithoutTracking(cleanSlug)
          .then(async (lookup) => {
            if (!isMounted) return;
            if (lookup.exists && lookup.originalUrl) {
              setStatus('public');
              const res = await trackUnlockAndResolveTarget(
                cleanSlug,
                lookup.originalUrl,
              );
              if (res.status === 'SUCCESS' && res.targetUrl) {
                setDestinationUrl(res.targetUrl);
                window.location.replace(res.targetUrl);
              } else if (res.status === 'DISABLED' || res.status === 'EXPIRED') {
                window.location.replace(
                  `/links/notice?slug=${encodeURIComponent(cleanSlug)}&status=${res.status.toLowerCase()}`,
                );
              }
            } else {
              setStatus('not_found');
            }
          })
          .catch(() => {
            if (isMounted) setStatus('not_found');
          });
      }
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [cleanSlug]);

  const handleUnlockSuccess = async (targetFromGate: string) => {
    const res = await trackUnlockAndResolveTarget(
      cleanSlug,
      targetFromGate || destinationUrl,
    );

    if (res.status === 'DISABLED' || res.status === 'EXPIRED') {
      window.location.replace(
        `/links/notice?slug=${encodeURIComponent(cleanSlug)}&status=${res.status.toLowerCase()}`,
      );
      return;
    }

    if (res.targetUrl) {
      window.location.replace(res.targetUrl);
    } else {
      setDestinationUrl(null);
      setStatus('unlocked');
    }
  };

  if (status === 'checking') {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl max-w-sm w-full space-y-3 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
          Đang kiểm tra trạng thái liên kết...
        </h2>
      </div>
    );
  }

  if (status === 'unlocked') {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-900/60 shadow-xl max-w-md w-full space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <UnlockIcon className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
          Đã mở khóa thành công
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Liên kết <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">/s/{cleanSlug}</span> đã được xác thực thành công, nhưng hiện chưa có URL đích chuyển hướng.
        </p>
        <div className="pt-2 flex justify-center gap-2">
          <Link
            href="/protected-link"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            Về trang Bảo mật link
          </Link>
          <Link
            href="/"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
          >
            Trang chủ
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'public' || status === 'not_found') {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl max-w-md w-full space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 flex items-center justify-center mx-auto">
          {status === 'public' ? <UnlockIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" /> : <SearchIcon className="w-6 h-6" />}
        </div>
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
          {status === 'public' ? 'Liên kết công khai' : `Không tìm thấy /s/${cleanSlug}`}
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {status === 'public' ? (
            <>
              Mã <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">/s/{cleanSlug}</span> không cài mật khẩu bảo vệ.
            </>
          ) : (
            <>
              Liên kết <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">/s/{cleanSlug}</span> chưa có trên hệ thống hoặc chưa được cài mật khẩu.
            </>
          )}
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-2">
          <Link
            href={`/protected-link/set-password?slug=${encodeURIComponent(cleanSlug)}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            <KeyIcon className="w-3.5 h-3.5" />
            <span>Đặt mật khẩu cho link này</span>
          </Link>
          <Link
            href="/protected-link"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
          >
            <LockIcon className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ProtectedLinkGate
      slug={cleanSlug}
      initialPassword={pwQuery}
      fallbackTargetUrl={destinationUrl}
      onSuccess={handleUnlockSuccess}
    />
  );
}

export default function ProtectedLinkSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl max-w-sm w-full space-y-3 text-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Đang tải...
            </h2>
          </div>
        }
      >
        <ProtectedSlugContent paramsPromise={params} />
      </Suspense>
    </main>
  );
}
