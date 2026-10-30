'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ShortenedLink } from '@/types/url';
import { createShortUrl, validateUrl } from '@/lib/url-shortener';

interface UrlShortenerFormProps {
  onSuccess: (link: ShortenedLink) => void;
}

export function UrlShortenerForm({ onSuccess }: UrlShortenerFormProps) {
  const { t } = useLanguage();
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const charCount = urlInput.length;
  const isOverLimit = charCount > 2048;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text.trim());
        setErrorKey(null);
      }
    } catch {
      // Fallback
    }
  };

  const handleClear = () => {
    setUrlInput('');
    setErrorKey(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateUrl(urlInput);
    if (!validation.isValid) {
      setErrorKey(validation.error || 'errorInvalidUrl');
      return;
    }

    setErrorKey(null);
    setLoading(true);

    try {
      // Đảm bảo phản hồi nhanh dưới 1 giây theo Tiêu chí nghiệm thu (Given/When/Then)
      const link = await createShortUrl(urlInput);
      onSuccess(link);
      setUrlInput('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'errorInvalidUrl';
      setErrorKey(msg);
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = () => {
    if (!errorKey) return null;
    switch (errorKey) {
      case 'errorEmpty':
        return t('urlShortener.errorEmpty') || 'Vui lòng nhập đường dẫn URL cần rút gọn';
      case 'errorTooLong':
        return t('urlShortener.errorTooLong') || 'Đường dẫn vượt quá độ dài tối đa 2.048 ký tự';
      case 'errorInvalidProtocol':
        return (
          t('urlShortener.errorInvalidProtocol') ||
          'Đường dẫn phải bắt đầu bằng giao thức http:// hoặc https://'
        );
      case 'errorInvalidUrl':
      default:
        return (
          t('urlShortener.errorInvalidUrl') ||
          'Đường dẫn URL không hợp lệ. Vui lòng kiểm tra lại cấu trúc URL.'
        );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4"
    >
      <div className="flex items-center justify-between">
        <label
          htmlFor="long-url-input"
          className="block text-sm font-bold text-neutral-900 dark:text-white"
        >
          {t('urlShortener.inputLabel') || 'Dán đường dẫn cần rút gọn (URL):'}
        </label>

        {/* Char Counter */}
        <span
          className={`text-xs font-mono font-medium ${
            isOverLimit
              ? 'text-red-600 dark:text-red-400 font-bold'
              : 'text-neutral-400 dark:text-neutral-500'
          }`}
        >
          {charCount} / 2.048 ký tự
        </span>
      </div>

      {/* Main Input Box with Actions */}
      <div className="relative">
        <div className="flex items-center rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-neutral-800 transition overflow-hidden">
          {/* Protocol prefix indicator icon */}
          <div className="pl-4 pr-2 text-neutral-400 dark:text-neutral-500 flex items-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>

          <input
            id="long-url-input"
            type="text"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              if (errorKey) setErrorKey(null);
            }}
            placeholder={
              t('urlShortener.inputPlaceholder') ||
              'https://example.com/duong-dan-rat-dai-cua-ban...'
            }
            disabled={loading}
            className="w-full py-3.5 px-2 bg-transparent text-sm sm:text-base text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 outline-none"
            autoComplete="off"
            autoFocus
          />

          {/* Quick Clear Button */}
          {urlInput && (
            <button
              type="button"
              onClick={handleClear}
              title="Xoá nội dung"
              className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition"
            >
              ✕
            </button>
          )}

          {/* Quick Paste Button */}
          <button
            type="button"
            onClick={handlePaste}
            className="mr-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-200/70 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 transition shrink-0 flex items-center gap-1"
          >
            📋 {t('urlShortener.pasteBtn') || 'Dán'}
          </button>
        </div>

        {/* Error alert message */}
        {errorKey && (
          <div className="mt-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center gap-2 text-xs font-semibold text-red-700 dark:text-red-300 animate-in fade-in slide-in-from-top-1">
            <span>⚠️</span>
            <span>{getErrorMessage()}</span>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          ⚡ Phản hồi siêu tốc &lt; 1 giây • Tự động tạo slug an toàn 6–8 ký tự
        </p>

        <button
          type="submit"
          disabled={loading || isOverLimit}
          className="w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-95 transition shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{t('urlShortener.shortening') || 'Đang rút gọn...'}</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <span>{t('urlShortener.shortenBtn') || 'Rút gọn liên kết'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
