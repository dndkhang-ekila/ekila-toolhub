'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { GoogleSignInButton } from './GoogleSignInButton';
import { PasswordStrengthMeter } from './PasswordStrength';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon, ShieldCheckIcon } from '../ui/Icons';
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
} from '@/lib/validation';

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleValidate = () => {
    const newErrors: typeof errors = {};

    const emailRes = validateEmail(email);
    if (!emailRes.isValid) {
      newErrors.email = emailRes.error;
    }

    const passRes = validatePassword(password);
    if (!passRes.isValid) {
      newErrors.password = passRes.error;
    }

    const confirmRes = validateConfirmPassword(password, confirmPassword);
    if (!confirmRes.isValid) {
      newErrors.confirmPassword = confirmRes.error;
    }

    if (!agreeTerms) {
      newErrors.terms = 'Bạn cần đồng ý với Điều khoản và Chính sách bảo vệ dữ liệu cá nhân.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!handleValidate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        email,
        password,
        locale: 'vi',
      });

      // Theo SRS FR-ACC-01: Đăng ký có xác minh email
      // Sau khi tạo tài khoản thành công, điều hướng đến màn hình xác minh email
      router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Đăng ký không thành công. Vui lòng thử lại sau.';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Tạo tài khoản ToolHub
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Bắt đầu miễn phí và truy cập trọn bộ tiện ích tiện lợi
        </p>
      </div>

      {serverError && (
        <Alert variant="error" onClose={() => setServerError(null)}>
          {serverError}
        </Alert>
      )}

      {/* Đăng ký nhanh với Google */}
      <div>
        <GoogleSignInButton
          mode="register"
          disabled={isSubmitting}
          onSuccess={() => router.push('/')}
          onError={(err) => setServerError(err)}
        />
      </div>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
        <span className="bg-white dark:bg-zinc-950 px-3 text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 shrink-0 font-medium">
          Hoặc đăng ký bằng email
        </span>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <Input
            id="register-email"
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
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            label="Mật khẩu"
            placeholder="Tối thiểu 8 ký tự, có chữ hoa, số, ký tự đặc biệt"
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
            autoComplete="new-password"
            required
            disabled={isSubmitting}
          />

          {/* Thanh đo độ mạnh mật khẩu */}
          <PasswordStrengthMeter password={password} />
        </div>

        <div>
          <Input
            id="register-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu ở trên"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) {
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }
            }}
            error={errors.confirmPassword}
            leftIcon={<LockIcon className="w-5 h-5" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="hover:text-zinc-600 dark:hover:text-zinc-300 focus:outline-none p-1 cursor-pointer"
                aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOffIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            }
            autoComplete="new-password"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Cam kết tuân thủ Nghị định 13/2023/NĐ-CP theo SRS 2.5 */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-600 dark:text-zinc-400 select-none">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                if (errors.terms) setErrors((prev) => ({ ...prev, terms: undefined }));
              }}
              className="mt-0.5 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 w-4 h-4 shrink-0"
              disabled={isSubmitting}
            />
            <span className="leading-relaxed">
              Tôi đồng ý với{' '}
              <span className="text-zinc-800 dark:text-zinc-200 font-medium">Điều khoản sử dụng</span>{' '}
              và{' '}
              <span className="text-zinc-800 dark:text-zinc-200 font-medium">
                Chính sách bảo vệ dữ liệu cá nhân (theo NĐ 13/2023/NĐ-CP)
              </span>.
            </span>
          </label>
          {errors.terms && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.terms}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          leftIcon={<ShieldCheckIcon className="w-5 h-5" />}
        >
          Đăng ký tài khoản
        </Button>
      </form>

      <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        Bạn đã có tài khoản?{' '}
        <Link
          href="/login"
          className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          Đăng nhập
        </Link>
      </div>
    </div>
  );
}
