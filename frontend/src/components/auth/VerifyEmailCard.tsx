'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { MailIcon, CheckCircleIcon, ArrowLeftIcon, SpinnerIcon } from '../ui/Icons';
import { validateVerificationCode } from '@/lib/validation';

export function VerifyEmailCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail, resendVerification } = useAuth();

  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || '';

  const [email, setEmail] = useState(emailParam);
  // OTP 6 digits input state
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Timer đếm ngược 60 giây chống spam gửi lại email (Rate limiting NFR-SEC-04)
  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown, canResend]);

  const handleVerify = useCallback(
    async (codeToVerify?: string, tokenToVerify?: string) => {
      setError(null);
      setIsVerifying(true);

      try {
        const payload = {
          email: email.trim().toLowerCase(),
          code: codeToVerify,
          token: tokenToVerify,
        };

        await verifyEmail(payload);
        setIsSuccess(true);
        setInfoMessage('Xác minh địa chỉ email thành công!');

        // Tự động chuyển hướng sau 2 giây
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Mã hoặc token xác minh không chính xác hoặc đã hết hạn.';
        setError(msg);
      } finally {
        setIsVerifying(false);
      }
    },
    [email, router, verifyEmail]
  );

  // Tự động kích hoạt nếu có token từ query params (link trong email gửi tới)
  useEffect(() => {
    if (!tokenParam) return;
    const timer = setTimeout(() => {
      handleVerify(undefined, tokenParam);
    }, 100);
    return () => clearTimeout(timer);
  }, [tokenParam, handleVerify]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    // Nếu người dùng dán cả chuỗi 6 chữ số
    if (value.length > 1) {
      const pastedDigits = value.slice(0, 6).split('');
      pastedDigits.forEach((digit, idx) => {
        if (index + idx < 6) {
          newDigits[index + idx] = digit;
        }
      });
      setDigits(newDigits);
      const nextIndex = Math.min(index + pastedDigits.length, 5);
      inputRefs.current[nextIndex]?.focus();

      // Nếu đủ 6 số, tự động trigger xác minh
      if (newDigits.every((d) => d !== '')) {
        handleVerify(newDigits.join(''));
      }
      return;
    }

    newDigits[index] = value;
    setDigits(newDigits);

    // Tự động nhảy sang ô tiếp theo
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Nếu đủ 6 số, tự động verify
    if (newDigits.every((d) => d !== '')) {
      handleVerify(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    const validation = validateVerificationCode(code);
    if (!validation.isValid) {
      setError(validation.error || 'Vui lòng nhập đủ 6 chữ số mã xác minh.');
      return;
    }
    handleVerify(code);
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;
    if (!email) {
      setError('Vui lòng nhập địa chỉ email cần gửi lại mã xác minh.');
      return;
    }

    setIsResending(true);
    setError(null);
    try {
      const res = await resendVerification({ email: email.trim().toLowerCase() });
      setInfoMessage(res.message || 'Mã xác minh mới đã được gửi vào hộp thư của bạn.');
      setCountdown(60);
      setCanResend(false);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Không thể gửi lại email xác minh lúc này.';
      setError(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
          {isSuccess ? (
            <CheckCircleIcon className="w-7 h-7 text-emerald-500" />
          ) : (
            <MailIcon className="w-6 h-6" />
          )}
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {isSuccess ? 'Xác minh thành công!' : 'Xác minh địa chỉ Email'}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {isSuccess
            ? 'Tài khoản của bạn đã được kích hoạt. Đang chuyển hướng vào hệ thống...'
            : `Chúng tôi đã gửi mã xác nhận 6 chữ số đến`}
        </p>
        {!isSuccess && (
          email ? (
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800/80 py-1 px-3 rounded-full inline-block">
                {email}
              </span>
              <button
                type="button"
                onClick={() => setEmail('')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Đổi email
              </button>
            </div>
          ) : (
            <div className="max-w-xs mx-auto pt-1">
              <input
                type="email"
                placeholder="Nhập email cần xác minh"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-center text-xs py-1.5 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )
        )}
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {infoMessage && (
        <Alert variant={isSuccess ? 'success' : 'info'} onClose={() => setInfoMessage(null)}>
          {infoMessage}
        </Alert>
      )}

      {isSuccess ? (
        <div className="pt-4 space-y-3">
          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => router.push('/')}
          >
            Bắt đầu khám phá ToolHub
          </Button>
        </div>
      ) : (
        <form onSubmit={handleManualSubmit} className="space-y-6">
          {/* Ô nhập 6 chữ số OTP */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 text-center mb-3">
              Nhập mã 6 chữ số từ email của bạn
            </label>
            <div className="flex justify-between gap-2 max-w-xs mx-auto">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  disabled={isVerifying}
                  className="w-11 h-13 text-center text-xl font-bold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-xs disabled:opacity-50"
                  aria-label={`Chữ số thứ ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Gợi ý test phía client khi backend chưa kết nối SMTP */}
          <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-center">
            <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
              💡 <strong>Chế độ phát triển (Dev Mode):</strong> Vì Backend chưa cấu hình máy chủ gửi mail SMTP thật, bạn có thể nhập 6 số bất kỳ (ví dụ: <span className="font-bold underline">123456</span>) và bấm xác minh để kích hoạt tài khoản ngay.
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isVerifying}
          >
            Xác minh tài khoản
          </Button>

          {/* Gửi lại mã & đếm ngược */}
          <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-2 pt-2">
            <p>Không nhận được email? Kiểm tra thư mục Spam hoặc</p>
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                {isResending && <SpinnerIcon className="w-3.5 h-3.5 animate-spin" />}
                Gửi lại mã xác minh
              </button>
            ) : (
              <p className="text-zinc-400 dark:text-zinc-500 font-medium">
                Gửi lại sau <span className="font-bold text-blue-600 dark:text-blue-400">{countdown}s</span>
              </p>
            )}
          </div>

          <div className="text-center pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Link
              href="/login"
              className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1.5"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Quay lại Đăng nhập
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
