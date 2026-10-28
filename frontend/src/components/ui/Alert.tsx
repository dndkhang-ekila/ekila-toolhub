import React from 'react';
import { AlertCircleIcon, CheckCircleIcon } from './Icons';

export interface AlertProps {
  variant?: 'error' | 'success' | 'info' | 'warning';
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export function Alert({
  variant = 'info',
  title,
  children,
  className = '',
  onClose,
}: AlertProps) {
  const variantStyles = {
    error:
      'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300',
    success:
      'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300',
    info:
      'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-300',
    warning:
      'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300',
  };

  const iconStyles = {
    error: 'text-red-500 dark:text-red-400',
    success: 'text-emerald-500 dark:text-emerald-400',
    info: 'text-blue-500 dark:text-blue-400',
    warning: 'text-amber-500 dark:text-amber-400',
  };

  const IconComponent =
    variant === 'success' ? CheckCircleIcon : AlertCircleIcon;

  return (
    <div
      role="alert"
      className={`rounded-lg border p-3.5 text-sm flex gap-3 items-start transition-all ${variantStyles[variant]} ${className}`}
    >
      <div className={`shrink-0 mt-0.5 ${iconStyles[variant]}`}>
        <IconComponent className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        {title && <h4 className="font-semibold text-sm mb-0.5">{title}</h4>}
        <div className="text-xs leading-relaxed opacity-95">{children}</div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
          aria-label="Đóng thông báo"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
