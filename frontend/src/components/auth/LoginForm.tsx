'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { GoogleSignInButton } from './GoogleSignInButton';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from '../ui/Icons';
import { validateEmail } from '@/lib/validation';

interface LoginFormProps {
  redirectUrl?: string;
}

export function LoginForm({ redirectUrl = '/' }: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverWarning, setServerWarning] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleValidate = () => {
    const newErrors: { email?: string; password?: string } = {};

    const emailRes = validateEmail(email);
    if (!emailRes.isValid) {
      newErrors.email = emailRes.error;
    }

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setServerWarning(null);
    setUnverifiedEmail(null);

    if (!handleValidate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login({
        email,
        password,
        rememberMe,
      });

      if (res.requiresEmailVerification) {
        setUnverifiedEmail(email);
        setServerWarning('Tài khoản của bạn chưa được xác minh email. Vui lòng xác minh để tiếp tục.');
        return;
      }

      // Đăng nhập thành công, chuyển hướng
      router.push(redirectUrl);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.';

      if (message.toLowerCase().includes('chưa xác minh') || message.toLowerCase().includes('unverified')) {
        setUnverifiedEmail(email);
        setServerWarning('Email này chưa được xác minh. Vui lòng xác minh hộp thư của bạn.');
      } else {
        setServerError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Đăng nhập vào ToolHub
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Truy cập tài khoản để đồng bộ tiện ích và mở rộng hạn mức
        </p>
      </div>

      {serverError && (
        <Alert variant="error" onClose={() => setServerError(null)}>
          {serverError}
        </Alert>
      )}

      {serverWarning && (
        <Alert variant="warning" onClose={() => setServerWarning(null)}>
          <div className="space-y-2">
            <p>{serverWarning}</p>
            {unverifiedEmail && (
              <div>
                <Link
                  href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                  className="font-semibold underline hover:text-amber-900 dark:hover:text-amber-200"
                >
                  Nhấn vào đây để xác minh email ngay →
                </Link>
              </div>
            )}
          </div>
        </Alert>
      )}

      {/* Đăng nhập bằng Google */}
      <div>
        <GoogleSignInButton
          mode="login"
          disabled={isSubmitting}
          onSuccess={() => router.push(redirectUrl)}
          onError={(err) => setServerError(err)}
        />
      </div>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
        <span className="bg-white dark:bg-zinc-950 px-3 text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 shrink-0 font-medium">
          Hoặc với email
        </span>
      </div>

      {/* Form đăng nhập email + mật khẩu */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <Input
            id="login-email"
            type="email"
            label="Địa chỉ email"
            placeholder="ten@vidu.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            error={errors.email}
            leftIcon={<MailIcon className="w-5 h-5" />}
            autoComplete="email"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            label="Mật khẩu"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={errors.password}
            leftIcon={<LockIcon className="w-5 h-5" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-zinc-600 dark:hover:text-zinc-300 focus:outline-none p-1 cursor-pointer"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            }
            autoComplete="current-password"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 w-4 h-4"
              disabled={isSubmitting}
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>

          <span className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 cursor-not-allowed" title="Tính năng Quên mật khẩu thuộc mã FR-ACC-03 (P2)">
            Quên mật khẩu?
          </span>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
        >
          Đăng nhập
        </Button>
      </form>

      <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        Bạn chưa có tài khoản?{' '}
        <Link
          href="/register"
          className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          Đăng ký ngay
        </Link>
      </div>
    </div>
  );
}
