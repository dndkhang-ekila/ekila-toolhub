'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  extractSlugFromInput,
  protectedLinkStorage,
} from '@/lib/protected-link-storage';
import {
  lookupLinkWithoutTracking,
  trackUnlockAndResolveTarget,
} from '@/lib/protected-link-service';
import { ProtectedLinkMeta } from '@/types/protected-link';
import {
  CheckCircleIcon,
  CopyIcon,
  LockIcon,
  SearchIcon,
  SpinnerIcon,
} from '@/components/ui/Icons';
import {
  ExternalLinkIcon,
  KeyIcon,
  UnlockIcon,
  XMarkIcon,
  copyTextToClipboard,
} from '../ProtectedLinkIcons';
import { ProtectedLinkGate } from './ProtectedLinkGate';

interface LinkSearchUnlockProps {
  initialSlug?: string;
  onRequestSetPassword?: (slug: string) => void;
}

export function LinkSearchUnlock({
  initialSlug = '',
  onRequestSetPassword,
}: LinkSearchUnlockProps) {
  const [searchInput, setSearchInput] = useState(initialSlug);
  const [searchedSlug, setSearchedSlug] = useState<string | null>(() => {
    const extracted = extractSlugFromInput(initialSlug);
    return extracted || null;
  });
  const [unlockedState, setUnlockedState] = useState<{
    slug: string;
    status: 'SUCCESS' | 'DISABLED' | 'EXPIRED' | 'NO_TARGET';
    targetUrl: string | null;
  } | null>(null);
  const [lookupResult, setLookupResult] = useState<{
    slug: string;
    exists: boolean;
    originalUrl: string | null;
  } | null>(null);
  const [isCheckingLookup, setIsCheckingLookup] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [protectedList, setProtectedList] = useState<Record<string, ProtectedLinkMeta>>({});
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    const syncStorage = () => {
      setProtectedList(protectedLinkStorage.getAll());
      setIsClientReady(true);
    };
    const timer = setTimeout(syncStorage, 0);
    window.addEventListener('storage', syncStorage);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', syncStorage);
    };
  }, []);

  const currentMeta = searchedSlug ? protectedList[searchedSlug] || null : null;
  const isCurrentSlugProtected = Boolean(currentMeta?.hasPassword);

  useEffect(() => {
    if (!isClientReady || !searchedSlug || isCurrentSlugProtected) {
      return;
    }

    let isMounted = true;
    const slugToCheck = searchedSlug;
    const timer = setTimeout(() => {
      if (!isMounted) return;
      setIsCheckingLookup(true);
      lookupLinkWithoutTracking(slugToCheck)
        .then((res) => {
          if (!isMounted) return;
          setLookupResult({
            slug: slugToCheck,
            exists: res.exists,
            originalUrl: res.originalUrl,
          });
        })
        .catch(() => {
          if (!isMounted) return;
          setLookupResult({
            slug: slugToCheck,
            exists: false,
            originalUrl: null,
          });
        })
        .finally(() => {
          if (isMounted) setIsCheckingLookup(false);
        });
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isClientReady, searchedSlug, isCurrentSlugProtected]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlug = extractSlugFromInput(searchInput);
    if (cleanSlug) {
      setProtectedList(protectedLinkStorage.getAll());
      setSearchedSlug(cleanSlug);
      setUnlockedState(null);
      setLookupResult(null);
      setCopiedUrl(false);
    }
  };

  const handleQuickSelect = (slug: string) => {
    setProtectedList(protectedLinkStorage.getAll());
    setSearchInput(slug);
    setSearchedSlug(slug);
    setUnlockedState(null);
    setLookupResult(null);
    setCopiedUrl(false);
  };

  const handleResetSearch = () => {
    setSearchInput('');
    setSearchedSlug(null);
    setUnlockedState(null);
    setLookupResult(null);
    setCopiedUrl(false);
  };

  const handleCopyDestination = async (url: string) => {
    if (await copyTextToClipboard(url)) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const protectedSlugs = Object.keys(protectedList);
  const isUnlockedForCurrent = unlockedState?.slug === searchedSlug;
  const activeLookup = lookupResult?.slug === searchedSlug ? lookupResult : null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Search Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
            <SearchIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Tra cứu &amp; Mở khóa liên kết
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
              Dán đường dẫn rút gọn hoặc mã slug. Nếu liên kết được khóa mật khẩu, hệ thống sẽ yêu cầu xác thực trước khi truy cập.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch}>
          <div className="flex items-center rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-950 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-neutral-900 transition overflow-hidden">
            <span className="pl-4 pr-2 text-neutral-400">
              <SearchIcon className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Dán link rút gọn hoặc nhập slug (VD: /s/abc123)..."
              className="w-full py-3 px-2 text-xs sm:text-sm bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleResetSearch}
                aria-label="Xóa nội dung tìm kiếm"
                className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={!extractSlugFromInput(searchInput)}
              className="mr-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              Kiểm tra
            </button>
          </div>
        </form>

        {/* Quick access pills for protected links */}
        {isClientReady && protectedSlugs.length > 0 && (
          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Đang khóa bảo vệ ({protectedSlugs.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {protectedSlugs.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleQuickSelect(s)}
                  className={`px-2.5 py-1.5 text-xs font-mono font-semibold rounded-xl border transition inline-flex items-center gap-1.5 cursor-pointer ${
                    searchedSlug === s
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-neutral-50 dark:bg-neutral-800/70 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-indigo-400'
                  }`}
                >
                  <LockIcon className="w-3 h-3" />
                  <span>/s/{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Area */}
      {isClientReady && searchedSlug && (
        <div className="animate-in fade-in zoom-in-95 duration-200">
          {isCurrentSlugProtected ? (
            isUnlockedForCurrent ? (
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-900/60 text-center space-y-4 shadow-sm max-w-md mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircleIcon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                    {unlockedState.status === 'DISABLED'
                      ? 'Liên kết đã bị vô hiệu hóa'
                      : unlockedState.status === 'EXPIRED'
                      ? 'Liên kết đã hết hạn truy cập'
                      : 'Mở khóa thành công'}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Xác thực thành công cho{' '}
                    <strong className="font-mono text-indigo-600 dark:text-indigo-400">
                      /s/{searchedSlug}
                    </strong>
                    {unlockedState.status === 'DISABLED'
                      ? ', nhưng chủ sở hữu đã tạm tắt liên kết này.'
                      : unlockedState.status === 'EXPIRED'
                      ? ', nhưng liên kết này đã vượt quá thời hạn hoạt động.'
                      : unlockedState.targetUrl
                      ? '. Bạn có thể truy cập liên kết đích bên dưới.'
                      : '.'}
                  </p>
                </div>

                {unlockedState.status === 'DISABLED' || unlockedState.status === 'EXPIRED' ? null : unlockedState.targetUrl ? (
                  <p className="text-xs font-mono font-medium text-indigo-600 dark:text-indigo-400 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200/70 dark:border-neutral-700 p-3 rounded-xl break-all">
                    {unlockedState.targetUrl}
                  </p>
                ) : (
                  <p className="text-xs text-neutral-400 bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-xl">
                    Liên kết này chưa gắn URL đích chuyển hướng.
                  </p>
                )}

                <div className="pt-2 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetSearch}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
                  >
                    Tìm link khác
                  </button>
                  {unlockedState.targetUrl && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCopyDestination(unlockedState.targetUrl!)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                      >
                        {copiedUrl ? (
                          <>
                            <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Đã sao chép</span>
                          </>
                        ) : (
                          <>
                            <CopyIcon className="w-3.5 h-3.5" />
                            <span>Sao chép URL</span>
                          </>
                        )}
                      </button>
                      <a
                        href={unlockedState.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-xs"
                      >
                        <span>Truy cập trang đích</span>
                        <ExternalLinkIcon className="w-3.5 h-3.5" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <ProtectedLinkGate
                key={searchedSlug}
                slug={searchedSlug}
                fallbackTargetUrl={currentMeta?.originalUrl || null}
                onSuccess={async (targetUrl) => {
                  const slugAtUnlock = searchedSlug;
                  const res = await trackUnlockAndResolveTarget(
                    slugAtUnlock,
                    targetUrl || currentMeta?.originalUrl || null,
                  );
                  setUnlockedState({
                    slug: slugAtUnlock,
                    status: res.status,
                    targetUrl: res.targetUrl,
                  });
                }}
              />
            )
          ) : isCheckingLookup ? (
            <div className="p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm text-center space-y-3 max-w-md mx-auto">
              <SpinnerIcon className="w-6 h-6 text-indigo-600 mx-auto" />
              <p className="text-xs text-neutral-500">Đang kiểm tra trạng thái liên kết...</p>
            </div>
          ) : activeLookup?.exists && activeLookup.originalUrl ? (
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm text-center space-y-3.5 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <UnlockIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Liên kết công khai
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Mã{' '}
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    /s/{searchedSlug}
                  </span>{' '}
                  hiện chưa đặt mật khẩu bảo vệ.
                </p>
              </div>
              <p className="text-xs font-mono text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200/70 dark:border-neutral-700 p-2.5 rounded-xl break-all">
                {activeLookup.originalUrl}
              </p>
              <div className="pt-1 flex flex-wrap justify-center gap-2">
                <a
                  href={activeLookup.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  <span>Mở trang đích</span>
                  <ExternalLinkIcon className="w-3.5 h-3.5" />
                </a>
                {onRequestSetPassword ? (
                  <button
                    type="button"
                    onClick={() => onRequestSetPassword(searchedSlug)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
                  >
                    <KeyIcon className="w-3.5 h-3.5" />
                    <span>Cài mật khẩu</span>
                  </button>
                ) : (
                  <Link
                    href={`/protected-link/set-password?slug=${encodeURIComponent(searchedSlug)}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
                  >
                    <KeyIcon className="w-3.5 h-3.5" />
                    <span>Cài mật khẩu</span>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm text-center space-y-3.5 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 flex items-center justify-center mx-auto">
                <SearchIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Không tìm thấy /s/{searchedSlug}
                </h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                  Liên kết chưa tồn tại trên hệ thống hoặc chưa được thiết lập mật khẩu.
                </p>
              </div>
              <div className="pt-1 flex justify-center">
                {onRequestSetPassword ? (
                  <button
                    type="button"
                    onClick={() => onRequestSetPassword(searchedSlug)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
                  >
                    <KeyIcon className="w-3.5 h-3.5" />
                    <span>Tạo &amp; khóa slug này</span>
                  </button>
                ) : (
                  <Link
                    href={`/protected-link/set-password?slug=${encodeURIComponent(searchedSlug)}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
                  >
                    <KeyIcon className="w-3.5 h-3.5" />
                    <span>Tạo &amp; khóa slug này</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
