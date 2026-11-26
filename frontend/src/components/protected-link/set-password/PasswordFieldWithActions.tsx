'use client';

import React, { useState } from 'react';
import { generateStrongLinkPassword } from '@/lib/protected-link-storage';
import { CopyIcon, EyeIcon, EyeOffIcon } from '@/components/ui/Icons';
import {
  KeyIcon,
  RefreshIcon,
  copyTextToClipboard,
  getPasswordStrengthInfo,
} from '../ProtectedLinkIcons';

interface PasswordFieldWithActionsProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onGenerated?: (generated: string) => void;
  showPassword?: boolean;
  onToggleShowPassword?: (next: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Ô nhập mật khẩu dùng chung cho form đặt/sửa mật khẩu:
 * hỗ trợ sinh mật khẩu ngẫu nhiên, sao chép nhanh, ẩn/hiện và thanh đo độ mạnh.
 */
export function PasswordFieldWithActions({
  id,
  label,
  value,
  onChange,
  onGenerated,
  showPassword: controlledShow,
  onToggleShowPassword,
  placeholder = 'Nhập mật khẩu (tối thiểu 4 ký tự)...',
  disabled = false,
  required = false,
}: PasswordFieldWithActionsProps) {
  const [internalShow, setInternalShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const isShown = controlledShow !== undefined ? controlledShow : internalShow;
  const setShown = (next: boolean) => {
    if (onToggleShowPassword) onToggleShowPassword(next);
    else setInternalShow(next);
  };

  const strength = getPasswordStrengthInfo(value);

  const handleGenerate = () => {
    const generated = generateStrongLinkPassword(10);
    if (onGenerated) onGenerated(generated);
    else onChange(generated);
    setShown(true);
    setCopied(false);
  };

  const handleCopy = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (await copyTextToClipboard(trimmed)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
        >
          {label}
        </label>
        <div className="flex items-center gap-2.5">
          {value.trim().length > 0 && (
            <button
              type="button"
              onClick={handleCopy}
              disabled={disabled}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer disabled:opacity-40"
            >
              <CopyIcon className="w-3 h-3" />
              <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={disabled}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer disabled:opacity-40"
          >
            <RefreshIcon className="w-3 h-3" />
            <span>Tạo ngẫu nhiên</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
          <KeyIcon className="w-3.5 h-3.5" />
        </span>
        <input
          id={id}
          type={isShown ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          autoComplete="new-password"
          className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-950 pl-8 pr-9 py-2.5 text-xs font-mono text-neutral-900 dark:text-white placeholder-neutral-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-neutral-900 disabled:opacity-50 transition"
        />
        <button
          type="button"
          onClick={() => setShown(!isShown)}
          disabled={disabled}
          aria-label={isShown ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          title={isShown ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition cursor-pointer disabled:opacity-40"
        >
          {isShown ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
        </button>
      </div>

      {strength.level > 0 && (
        <div className="space-y-1 pt-0.5">
          <div className="grid grid-cols-3 gap-1">
            {[1, 2, 3].map((idx) => (
              <span
                key={idx}
                className={`h-1 rounded-full transition-colors ${
                  strength.level >= idx ? strength.barColor : 'bg-neutral-200 dark:bg-neutral-800'
                }`}
              />
            ))}
          </div>
          <p className={`text-[11px] font-medium ${strength.textColor}`}>{strength.label}</p>
        </div>
      )}
    </div>
  );
}
