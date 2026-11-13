'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface ShareModalProps {
  isOpen: boolean;
  shortUrl: string;
  originalUrl?: string;
  onClose: () => void;
}

export function ShareModal({ isOpen, shortUrl, originalUrl, onClose }: ShareModalProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = shortUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const encodedUrl = encodeURIComponent(shortUrl);
  const shareText = encodeURIComponent('Xem liên kết rút gọn qua ToolHub:');

  const socialChannels = [
    {
      name: 'Facebook',
      color: 'bg-[#1877F2] hover:bg-[#166fe5]',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'X (Twitter)',
      color: 'bg-black hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${shareText}`,
    },
    {
      name: 'Telegram',
      color: 'bg-[#2AABEE] hover:bg-[#229ed9]',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.197 1.006.128.832.942z" />
        </svg>
      ),
      url: `https://t.me/share/url?url=${encodedUrl}&text=${shareText}`,
    },
    {
      name: 'WhatsApp',
      color: 'bg-[#25D366] hover:bg-[#20ba5a]',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.301-.15-1.782-.879-2.058-.979-.276-.101-.477-.15-.678.15-.2.301-.778.979-.954 1.18-.176.2-.352.226-.653.075s-1.271-.469-2.421-1.495c-.895-.798-1.5-1.784-1.676-2.085-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.2-.301.301-.502.101-.2.05-.376-.025-.526s-.678-1.635-.929-2.238c-.244-.588-.492-.508-.678-.518-.176-.009-.377-.011-.578-.011s-.528.075-.804.376c-.276.301-1.055 1.03-1.055 2.511s1.08 2.912 1.231 3.113c.15.2 2.126 3.246 5.15 4.553.72.311 1.282.497 1.72.636.724.23 1.382.197 1.902.12.579-.086 1.782-.728 2.033-1.432.251-.703.251-1.306.176-1.432-.075-.126-.276-.201-.577-.351zM12.042 21.75c-1.748 0-3.46-.469-4.965-1.358l-.356-.211-3.693.968.986-3.599-.232-.369A9.714 9.714 0 0 1 2.33 12.04c0-5.362 4.364-9.725 9.729-9.725 2.597 0 5.039 1.012 6.877 2.85 1.838 1.838 2.85 4.28 2.85 6.877 0 5.364-4.364 9.728-9.729 9.728zM12.042.25C5.539.25.25 5.539.25 12.042c0 2.079.542 4.108 1.572 5.892L0 24l6.236-1.636a11.75 11.75 0 0 0 5.806 1.528h.005c6.502 0 11.792-5.289 11.792-11.792 0-3.15-1.226-6.11-3.454-8.338A11.72 11.72 0 0 0 12.042.25z" />
        </svg>
      ),
      url: `https://api.whatsapp.com/send?text=${shareText}%20${encodedUrl}`,
    },
    {
      name: 'Email',
      color: 'bg-emerald-600 hover:bg-emerald-700',
      icon: (
        <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      url: `mailto:?subject=${encodeURIComponent('Liên kết rút gọn ToolHub')}&body=${shareText}%20${encodedUrl}`,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              🔗
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              {t('urlShortener.shareModalTitle') || 'Chia sẻ liên kết rút gọn'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Short URL Box */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
            {t('urlShortener.shortUrl') || 'Liên kết rút gọn'}
          </p>
          <div className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80">
            <input
              type="text"
              readOnly
              value={shortUrl}
              className="bg-transparent border-none text-sm text-indigo-600 dark:text-indigo-400 font-mono font-semibold flex-1 outline-none truncate"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {copied ? (
                <>
                  <span>✓</span>
                  <span>{t('urlShortener.copiedBtn') || 'Đã sao chép!'}</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{t('urlShortener.copyBtn') || 'Sao chép'}</span>
                </>
              )}
            </button>
          </div>
          {originalUrl && (
            <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500 truncate">
              {t('urlShortener.originalUrl')}: {originalUrl}
            </p>
          )}
        </div>

        {/* Social channels */}
        <div className="mt-6">
          <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-3">
            {t('urlShortener.shareViaSocial') || 'Hoặc chia sẻ qua mạng xã hội:'}
          </p>
          <div className="grid grid-cols-5 gap-2.5">
            {socialChannels.map((item) => (
              <a
                key={item.name}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`Chia sẻ lên ${item.name}`}
                className={`flex flex-col items-center justify-center p-3 rounded-xl text-white transition-transform hover:scale-105 active:scale-95 shadow-sm ${item.color}`}
              >
                {item.icon}
                <span className="text-[10px] font-medium mt-1.5 truncate max-w-full">
                  {item.name}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
