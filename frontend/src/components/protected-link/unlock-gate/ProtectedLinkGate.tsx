'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { protectedLinkStorage } from '@/lib/protected-link-storage';
import {
  AlertCircleIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  ShieldCheckIcon,
  SpinnerIcon,
} from '@/components/ui/Icons';
import { KeyIcon, UnlockIcon } from '../ProtectedLinkIcons';

interface ProtectedLinkGateProps {
  slug: string;
  onSuccess: (targetUrl: string) => void | Promise<void>;
  fallbackTargetUrl?: string | null;
  initialPassword?: string;
}

export function ProtectedLinkGate({
  slug,
  onSuccess,
  fallbackTargetUrl,
  initialPassword = '',
}: ProtectedLinkGateProps) {
  const [password, setPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [remainingLockout, setRemainingLockout] = useState<number>(0);

  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoTriedRef = useRef(false);

  // Kiểm tra lockout còn lại khi mount và đếm lùi từng giây
  useEffect(() => {
    const checkLockout = () => {
      const attempts = protectedLinkStorage.getAttemptsData(slug);
      const now = Date.now();
      if (attempts.lockedUntil && now < attempts.lockedUntil) {
        setRemainingLockout(Math.ceil((attempts.lockedUntil - now) / 1000));
      } else {
        setRemainingLockout(0);
      }
    };

    const initTimer = setTimeout(checkLockout, 0);
    const interval = setInterval(checkLockout, 1000);
    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, [slug]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    };
  }, []);

  const verifyEnteredPassword = useCallback(
    async (candidatePassword: string) => {
      if (!candidatePassword.trim() || isVerifying || isSuccess) return;

      const attempts = protectedLinkStorage.getAttemptsData(slug);
      if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
        setRemainingLockout(Math.ceil((attempts.lockedUntil - Date.now()) / 1000));
        return;
      }

      setIsVerifying(true);
      setErrorMessage(null);

      try {
        const result = await protectedLinkStorage.verifyPassword(slug, candidatePassword);

        if (result.success) {
          setIsSuccess(true);
          const target = result.originalUrl || fallbackTargetUrl || '';
          successTimerRef.current = setTimeout(() => {
            void onSuccess(target);
          }, 550);
        } else {
          setErrorMessage(result.message || 'Mật khẩu không chính xác.');
          setIsShaking(true);
          if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
          shakeTimerRef.current = setTimeout(() => setIsShaking(false), 450);

          if (result.lockedUntil) {
            setRemainingLockout(Math.max(0, Math.ceil((result.lockedUntil - Date.now()) / 1000)));
          }
        }
      } catch {
        setErrorMessage('Đã xảy ra lỗi khi xác minh mật khẩu. Vui lòng thử lại.');
      } finally {
        setIsVerifying(false);
      }
    },
    [slug, fallbackTargetUrl, onSuccess, isVerifying, isSuccess],
  );

  // Tự động kiểm tra một lần nếu đường dẫn có kèm ?pw=... (tương tự Dub.co)
  useEffect(() => {
    if (autoTriedRef.current || !initialPassword.trim()) return;
    autoTriedRef.current = true;
    const timer = setTimeout(() => {
      void verifyEnteredPassword(initialPassword);
    }, 50);
    return () => clearTimeout(timer);
  }, [initialPassword, verifyEnteredPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (remainingLockout > 0) return;
    await verifyEnteredPassword(password);
  };

  const isLockedOut = remainingLockout > 0;

  return (
    <div className="w-full max-w-md mx-auto">
      <style>{`
        @keyframes gate-horizontal-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .animate-gate-shake {
          animation: gate-horizontal-shake 0.38s ease-in-out;
        }
      `}</style>

      <div
        className={`rounded-3xl border bg-white dark:bg-neutral-900 shadow-xl overflow-hidden transition-all duration-300 ${
          isShaking
            ? 'animate-gate-shake border-rose-400 dark:border-rose-700 ring-2 ring-rose-500/20'
            : isSuccess
            ? 'border-emerald-300 dark:border-emerald-800'
            : 'border-neutral-200/90 dark:border-neutral-800'
        }`}
      >
        {/* Thanh nhận diện thương hiệu xác thực (chống phishing như Rebrandly / Dub) */}
        <div className="px-6 py-3 bg-neutral-50/80 dark:bg-neutral-950/60 border-b border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-bold text-neutral-800 dark:text-neutral-200">
            <span className="w-5 h-5 rounded-md bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-xs">
              <ShieldCheckIcon className="w-3.5 h-3.5" />
            </span>
            <span>ToolHub Verify</span>
          </div>

          <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 truncate max-w-[180px]">
            /s/{slug}
          </span>
        </div>

        <div className="p-7 sm:p-8 text-center relative">
          {/* Icon trạng thái */}
          <div
            className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg transition-colors duration-300 ${
              isSuccess
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-emerald-500/20'
                : isLockedOut
                ? 'bg-gradient-to-tr from-rose-500 to-orange-500 shadow-rose-500/20'
                : 'bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-indigo-500/20'
            }`}
          >
            {isSuccess ? (
              <UnlockIcon className="h-7 w-7" />
            ) : (
              <LockIcon className="h-7 w-7" />
            )}
          </div>

          {/* Tiêu đề & mô tả tối giản */}
          <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            {isSuccess ? 'Đã mở khóa liên kết' : 'Liên kết được bảo vệ'}
          </h2>
          <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
            {isSuccess
              ? 'Xác thực thành công. Đang mở quyền truy cập đến trang đích...'
              : 'Nhập mật khẩu do người chia sẻ cung cấp để tiếp tục truy cập trang đích.'}
          </p>

          {/* Form nhập mật khẩu */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="text-left">
              <label
                htmlFor="protected-link-password"
                className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5"
              >
                Mật khẩu truy cập
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <KeyIcon className="w-4 h-4" />
                </span>
                <input
                  id="protected-link-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isVerifying || isSuccess || isLockedOut}
                  placeholder={isLockedOut ? `Tạm khóa (${remainingLockout}s)...` : 'Nhập mật khẩu...'}
                  className={`w-full rounded-xl border pl-10 pr-10 py-3 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 transition focus:outline-hidden ${
                    errorMessage
                      ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20'
                      : isSuccess
                      ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50/60 dark:bg-neutral-950/60 focus:border-indigo-500 focus:bg-white dark:focus:bg-neutral-900 focus:ring-2 focus:ring-indigo-500/20'
                  } disabled:opacity-50`}
                  autoComplete="current-password"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLockedOut || isSuccess}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition disabled:opacity-30"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>

              {isLockedOut && (
                <div
                  role="alert"
                  className="mt-2.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2"
                >
                  <ClockIcon className="w-4 h-4 shrink-0" />
                  <span>Nhập sai quá 5 lần. Vui lòng thử lại sau {remainingLockout} giây.</span>
                </div>
              )}

              {errorMessage && !isLockedOut && (
                <p
                  role="alert"
                  className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5 animate-in fade-in"
                >
                  <AlertCircleIcon className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </p>
              )}

              {isSuccess && (
                <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircleIcon className="w-4 h-4 shrink-0" />
                  <span>Mật khẩu chính xác! Đang kết nối trang đích...</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isVerifying || isSuccess || isLockedOut || !password.trim()}
              className={`w-full rounded-xl py-3 text-sm font-bold shadow-sm transition flex items-center justify-center gap-2 ${
                isSuccess
                  ? 'bg-emerald-600 text-white cursor-wait'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white shadow-indigo-600/20 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed'
              }`}
            >
              {isSuccess ? (
                <>
                  <SpinnerIcon className="w-4 h-4" />
                  <span>Đang chuyển hướng...</span>
                </>
              ) : isVerifying ? (
                <>
                  <SpinnerIcon className="w-4 h-4" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span>Mở khóa liên kết</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Liên kết phụ & cam kết bảo mật */}
          <div className="mt-5 pt-5 border-t border-neutral-100 dark:border-neutral-800 space-y-2.5">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
              <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Lượt truy cập chỉ ghi nhận sau khi xác thực thành công</span>
            </div>

            <div className="flex items-center justify-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
              <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                Trang chủ ToolHub
              </Link>
              <span className="text-neutral-300 dark:text-neutral-700">•</span>
              <Link href="/shorten-url" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                Rút gọn link mới
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
