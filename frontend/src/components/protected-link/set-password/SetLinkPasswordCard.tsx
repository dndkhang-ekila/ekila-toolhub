'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  extractSlugFromInput,
  protectedLinkStorage,
  validateLinkPasswordPair,
} from '@/lib/protected-link-storage';
import {
  AvailableShortLink,
  listAvailableShortLinks,
  lookupLinkWithoutTracking,
  protectShortLink,
} from '@/lib/protected-link-service';
import { ProtectedLinkMeta } from '@/types/protected-link';
import {
  AlertCircleIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  CopyIcon,
  LinkIcon,
  LockIcon,
  ShieldCheckIcon,
  SpinnerIcon,
} from '@/components/ui/Icons';
import { copyTextToClipboard } from '../ProtectedLinkIcons';
import { PasswordFieldWithActions } from './PasswordFieldWithActions';
import { ProtectedLinksList } from './ProtectedLinksList';

interface SetLinkPasswordCardProps {
  initialSlug?: string;
  onLinkProtected?: (slug: string) => void;
  onSelectSlugToUnlock?: (slug: string) => void;
}

export function SetLinkPasswordCard({
  initialSlug = '',
  onLinkProtected,
  onSelectSlugToUnlock,
}: SetLinkPasswordCardProps) {
  const [slug, setSlug] = useState(initialSlug);
  const [originalUrl, setOriginalUrl] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    slug: string;
    message: string;
  } | null>(null);
  const [protectedList, setProtectedList] = useState<Record<string, ProtectedLinkMeta>>({});
  const [availableLinks, setAvailableLinks] = useState<AvailableShortLink[]>([]);
  const [copiedBannerSlug, setCopiedBannerSlug] = useState(false);

  const refreshData = () => {
    setProtectedList(protectedLinkStorage.getAll());
    listAvailableShortLinks()
      .then((list) => setAvailableLinks(list))
      .catch(() => {
        // Ignore fetch error when backend is offline
      });
  };

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (!isMounted) return;
      refreshData();
      const normalizedInit = extractSlugFromInput(initialSlug);
      if (normalizedInit) {
        lookupLinkWithoutTracking(normalizedInit)
          .then((res) => {
            if (!isMounted || !res.originalUrl) return;
            setOriginalUrl((prev) => prev || res.originalUrl || '');
          })
          .catch(() => {
            // Ignore lookup error
          });
      }
    }, 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [initialSlug]);

  const extractedSlug = extractSlugFromInput(slug);
  const isUpdatingExisting = Boolean(extractedSlug && protectedList[extractedSlug]?.hasPassword);
  const isConfirmTyped = confirmPassword.trim().length > 0;
  const isConfirmMatch = isConfirmTyped && password.trim() === confirmPassword.trim();

  const handleSelectExistingLink = (selectedSlug: string) => {
    if (!selectedSlug) {
      setSlug('');
      setOriginalUrl('');
      setErrorMsg(null);
      return;
    }
    const chosen = availableLinks.find((item) => item.slug === selectedSlug);
    if (!chosen) return;
    setSlug(chosen.slug);
    setOriginalUrl(chosen.originalUrl || '');
    setErrorMsg(null);
    setSuccessInfo(null);
  };

  const handleEditPasswordForItem = (itemSlug: string, itemOriginalUrl?: string) => {
    setSlug(itemSlug);
    setOriginalUrl(itemOriginalUrl || '');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setErrorMsg(null);
    setSuccessInfo(null);
  };

  const handleCopyBannerLink = async (itemSlug: string) => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/protected-link/unlock-gate/${encodeURIComponent(itemSlug)}`;
    if (await copyTextToClipboard(url)) {
      setCopiedBannerSlug(true);
      setTimeout(() => setCopiedBannerSlug(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessInfo(null);

    const passwordError = validateLinkPasswordPair(password, confirmPassword, true);
    if (passwordError) {
      setErrorMsg(passwordError);
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await protectShortLink({
        slugInput: slug,
        originalUrlInput: originalUrl,
        password: password.trim(),
      });

      const msg = result.isUpdated
        ? `Đã cập nhật mật khẩu mới cho /s/${result.slug}.`
        : result.isReusedDuplicate
        ? `URL gốc đã có liên kết rút gọn /s/${result.slug}, đã gắn mật khẩu bảo vệ.`
        : `Đã tạo và bảo vệ liên kết /s/${result.slug} bằng mật khẩu.`;

      setSuccessInfo({ slug: result.slug, message: msg });
      setSlug('');
      setOriginalUrl('');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      refreshData();

      if (onLinkProtected) {
        onLinkProtected(result.slug);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Đã xảy ra lỗi khi lưu mật khẩu.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = (itemSlug: string) => {
    protectedLinkStorage.removePassword(itemSlug);
    refreshData();
    setSuccessInfo({
      slug: '',
      message: `Đã gỡ bỏ mật khẩu bảo vệ cho /s/${itemSlug}.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
              <LockIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                Thiết lập mật khẩu liên kết
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                Khóa liên kết rút gọn hiện có hoặc tạo liên kết bảo mật mới chỉ mở được khi nhập đúng mật khẩu.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 px-2.5 py-1 rounded-full shrink-0">
            <ShieldCheckIcon className="w-3.5 h-3.5" />
            <span>SHA-256</span>
          </span>
        </div>

        {availableLinks.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800 space-y-1.5">
            <label
              htmlFor="select-existing-link"
              className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
            >
              Chọn nhanh liên kết đã rút gọn
            </label>
            <select
              id="select-existing-link"
              value={extractedSlug && availableLinks.some((l) => l.slug === extractedSlug) ? extractedSlug : ''}
              onChange={(e) => handleSelectExistingLink(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">-- Nhập thủ công bên dưới hoặc chọn từ danh sách --</option>
              {availableLinks.map((item) => (
                <option key={item.slug} value={item.slug}>
                  /s/{item.slug} {item.isProtected ? '(Đã đặt mật khẩu)' : ''} → {item.originalUrl}
                </option>
              ))}
            </select>
          </div>
        )}

        {successInfo && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in">
            <span className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successInfo.message}</span>
            </span>
            {successInfo.slug && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopyBannerLink(successInfo.slug)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60 transition text-[11px] font-semibold cursor-pointer"
                >
                  <CopyIcon className="w-3 h-3" />
                  <span>{copiedBannerSlug ? 'Đã sao chép' : 'Sao chép link'}</span>
                </button>
                {onSelectSlugToUnlock ? (
                  <button
                    type="button"
                    onClick={() => onSelectSlugToUnlock(successInfo.slug)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition text-[11px] font-bold cursor-pointer"
                  >
                    <span>Mở khóa ngay</span>
                    <ArrowRightIcon className="w-3 h-3" />
                  </button>
                ) : (
                  <Link
                    href={`/protected-link/unlock-gate/${encodeURIComponent(successInfo.slug)}`}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition text-[11px] font-bold"
                  >
                    <span>Mở trang khóa</span>
                    <ArrowRightIcon className="w-3 h-3" />
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-in fade-in"
          >
            <AlertCircleIcon className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="set-password-original-url"
                className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
              >
                Đường dẫn URL gốc
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <LinkIcon className="w-3.5 h-3.5" />
                </span>
                <input
                  id="set-password-original-url"
                  type="url"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  placeholder="https://domain.com/tai-lieu"
                  className="w-full pl-8 pr-3 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white dark:focus:bg-neutral-900 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="set-password-slug"
                  className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                >
                  Mã rút gọn (tùy chọn)
                </label>
                {isUpdatingExisting && (
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    Đang cập nhật mật khẩu
                  </span>
                )}
              </div>
              <div className="flex items-center rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-950 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-neutral-900 overflow-hidden transition">
                <span className="px-3 py-2.5 text-xs font-mono bg-neutral-100 dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 text-neutral-500 select-none">
                  /s/
                </span>
                <input
                  id="set-password-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="Để trống để tự tạo mã"
                  className="w-full px-3 py-2.5 text-xs font-mono bg-transparent text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <PasswordFieldWithActions
              id="set-password-input"
              label="Mật khẩu bảo vệ"
              value={password}
              onChange={(val) => {
                setPassword(val);
                if (errorMsg) setErrorMsg(null);
              }}
              onGenerated={(gen) => {
                setPassword(gen);
                setConfirmPassword(gen);
                setErrorMsg(null);
              }}
              showPassword={showPassword}
              onToggleShowPassword={setShowPassword}
              required
            />

            <div className="space-y-1.5">
              <label
                htmlFor="set-password-confirm"
                className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
              >
                Xác nhận mật khẩu
              </label>
              <input
                id="set-password-confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Nhập lại mật khẩu..."
                required
                autoComplete="new-password"
                className="w-full px-3 py-2.5 text-xs font-mono rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white dark:focus:bg-neutral-900 transition"
              />
              {isConfirmTyped && (
                <p
                  className={`text-[11px] font-medium pt-0.5 ${
                    isConfirmMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                  }`}
                >
                  {isConfirmMatch ? 'Khớp mật khẩu' : 'Mật khẩu xác nhận chưa khớp'}
                </p>
              )}
            </div>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-neutral-100 dark:border-neutral-800">
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Lượt nhấp chỉ được ghi nhận khi người xem mở khóa thành công.
            </p>

            <button
              type="submit"
              disabled={isSubmitting || password.trim().length < 4 || (!slug.trim() && !originalUrl.trim())}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow-xs cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              {isSubmitting ? (
                <>
                  <SpinnerIcon className="w-3.5 h-3.5" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <LockIcon className="w-3.5 h-3.5" />
                  <span>{isUpdatingExisting ? 'Cập nhật mật khẩu' : 'Lưu mật khẩu bảo vệ'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <ProtectedLinksList
        protectedList={protectedList}
        onEdit={handleEditPasswordForItem}
        onRemove={handleRemove}
        onSelectSlugToUnlock={onSelectSlugToUnlock}
      />
    </div>
  );
}
