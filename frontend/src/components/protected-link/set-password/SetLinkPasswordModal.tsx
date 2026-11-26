'use client';

import React, { useState, useEffect } from 'react';
import {
  protectedLinkStorage,
  validateLinkPasswordPair,
} from '@/lib/protected-link-storage';
import {
  AlertCircleIcon,
  LockIcon,
  ShieldCheckIcon,
  SpinnerIcon,
} from '@/components/ui/Icons';
import { XMarkIcon } from '../ProtectedLinkIcons';
import { PasswordFieldWithActions } from './PasswordFieldWithActions';

interface SetLinkPasswordModalProps {
  isOpen: boolean;
  slug: string;
  originalUrl?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SetLinkPasswordModal({
  isOpen,
  slug,
  originalUrl,
  onClose,
  onSuccess,
}: SetLinkPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProtected, setIsProtected] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && slug) {
      const timer = setTimeout(() => {
        setIsProtected(protectedLinkStorage.isProtected(slug));
        setPassword('');
        setConfirmPassword('');
        setShowPassword(false);
        setErrorMsg(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, slug]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validationError = validateLinkPasswordPair(password, confirmPassword, true);
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    try {
      setIsSaving(true);
      await protectedLinkStorage.setPassword(slug, password.trim(), originalUrl);
      setIsProtected(true);
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      setErrorMsg('Đã xảy ra lỗi khi lưu mật khẩu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = () => {
    protectedLinkStorage.removePassword(slug);
    setIsProtected(false);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
              <LockIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Bảo vệ liên kết bằng mật khẩu
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Mã link:{' '}
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  /s/{slug}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer shrink-0"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Trạng thái hiện tại */}
        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 flex items-center justify-between text-xs">
          <span className="text-neutral-600 dark:text-neutral-400 font-medium">Trạng thái bảo vệ</span>
          {isProtected ? (
            <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
              <LockIcon className="w-3.5 h-3.5" />
              <span>Đang bật mật khẩu</span>
            </span>
          ) : (
            <span className="font-medium text-neutral-400">Chưa cài mật khẩu</span>
          )}
        </div>

        {/* Form nhập */}
        <form onSubmit={handleSave} className="space-y-4">
          <PasswordFieldWithActions
            id="modal-link-password"
            label={isProtected ? 'Mật khẩu mới' : 'Mật khẩu bảo vệ'}
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
              htmlFor="modal-link-confirm-password"
              className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
            >
              Xác nhận mật khẩu
            </label>
            <input
              id="modal-link-confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Nhập lại mật khẩu..."
              required
              autoComplete="new-password"
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-950 px-3.5 py-2.5 text-xs font-mono text-neutral-900 dark:text-white placeholder-neutral-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-neutral-900 transition"
            />
          </div>

          {errorMsg && (
            <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertCircleIcon className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </p>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Chỉ ghi nhận lượt truy cập khi mở khóa thành công.</span>
          </div>

          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-2">
            {isProtected ? (
              <button
                type="button"
                onClick={handleRemove}
                className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
              >
                Gỡ bỏ mật khẩu
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving || password.trim().length < 4}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-xs cursor-pointer disabled:cursor-not-allowed"
              >
                {isSaving && <SpinnerIcon className="w-3.5 h-3.5" />}
                <span>{isSaving ? 'Đang lưu...' : 'Lưu mật khẩu'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
