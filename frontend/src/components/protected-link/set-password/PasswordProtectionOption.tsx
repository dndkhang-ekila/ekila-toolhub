'use client';

import React from 'react';
import { AlertCircleIcon, LockIcon } from '@/components/ui/Icons';
import { PasswordFieldWithActions } from './PasswordFieldWithActions';

interface PasswordProtectionOptionProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  password: string;
  onPasswordChange: (password: string) => void;
  disabled?: boolean;
  error?: string | null;
}

export function PasswordProtectionOption({
  enabled,
  onToggle,
  password,
  onPasswordChange,
  disabled = false,
  error = null,
}: PasswordProtectionOptionProps) {
  return (
    <div className="rounded-2xl border border-indigo-100 dark:border-indigo-950/80 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 sm:p-5 space-y-3 transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
            <LockIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Bảo vệ link bằng mật khẩu
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Yêu cầu người nhận nhập đúng mật khẩu trước khi chuyển hướng tới URL gốc.
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            disabled={disabled}
            aria-label="Bật bảo vệ link bằng mật khẩu"
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-hidden rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-indigo-600 disabled:opacity-50" />
        </label>
      </div>

      {enabled && (
        <div className="pt-3 border-t border-indigo-100 dark:border-indigo-900/40 space-y-2 animate-in fade-in duration-150">
          <PasswordFieldWithActions
            id="link-password-input"
            label="Mật khẩu truy cập"
            value={password}
            onChange={onPasswordChange}
            disabled={disabled}
          />

          {error && (
            <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertCircleIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
