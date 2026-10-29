'use client';

import React, { useState } from 'react';
import QRCode from 'qrcode';
import { CopyIcon, CheckCircleIcon, SparklesIcon, AlertCircleIcon, LinkIcon } from '@/components/ui/Icons';

export function UrlShortenerTool() {
  const [longUrl, setLongUrl] = useState<string>('');
  const [customSlug, setCustomSlug] = useState<string>('');
  const [shortUrl, setShortUrl] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const generateSlug = (): string => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let trimmed = longUrl.trim();
    if (!trimmed) {
      setError('Vui lòng nhập địa chỉ URL cần rút gọn.');
      return;
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = 'https://' + trimmed;
    }

    try {
      new URL(trimmed);
    } catch {
      setError('Định dạng URL không hợp lệ. Vui lòng kiểm tra lại.');
      return;
    }

    if (trimmed.includes('toolhub.id.vn') || trimmed.includes(window.location.host)) {
      setError('Không được rút gọn liên kết trỏ về chính dịch vụ ToolHub.');
      return;
    }

    setLoading(true);

    try {
      const slug = customSlug.trim() || generateSlug();
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://toolhub.id.vn';
      const createdShortUrl = `${origin}/${slug}`;

      const qr = await QRCode.toDataURL(createdShortUrl, { width: 300, margin: 2 });
      setShortUrl(createdShortUrl);
      setQrCodeUrl(qr);
    } catch {
      setError('Đã có lỗi xảy ra trong quá trình rút gọn liên kết. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shortUrl) return;
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleShorten} className="space-y-4">
        <div>
          <label htmlFor="long-url" className="text-xs font-semibold text-foreground">
            Nhập liên kết dài cần rút gọn
          </label>
          <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                <LinkIcon className="h-4 w-4" />
              </div>
              <input
                id="long-url"
                type="text"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                placeholder="https://example.com/very-long-article-slug-with-parameters?ref=newsletter"
                className="w-full rounded-xl border border-input bg-card pl-10 pr-4 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-95 disabled:opacity-50"
            >
              {loading ? (
                'Đang tạo...'
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4" />
                  Rút gọn ngay
                </>
              )}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
          <label htmlFor="custom-slug" className="text-xs font-medium text-foreground">
            Tùy biến đuôi liên kết (Tùy chọn)
          </label>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">toolhub.id.vn/</span>
            <input
              id="custom-slug"
              type="text"
              value={customSlug}
              onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
              placeholder="duoi-link-tuy-chon"
              className="w-full max-w-xs rounded-lg border border-input bg-card px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
            <AlertCircleIcon className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>

      {shortUrl && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <CheckCircleIcon className="h-3 w-3" />
                Rút gọn thành công
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shortUrl}
                  className="rounded-lg border border-input bg-muted px-3 py-1.5 font-mono text-sm font-semibold text-primary"
                />
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95"
                >
                  {copied ? (
                    <>
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      Đã chép
                    </>
                  ) : (
                    <>
                      <CopyIcon className="h-3.5 w-3.5" />
                      Sao chép
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-md">
                Gốc: <span className="font-mono">{longUrl}</span>
              </p>
            </div>

            {qrCodeUrl && (
              <div className="flex flex-col items-center rounded-xl border border-border/80 bg-muted/30 p-3">
                <img src={qrCodeUrl} alt="Mã QR cho liên kết rút gọn" className="h-28 w-28 rounded-lg bg-white p-1" />
                <span className="mt-1 text-[10px] text-muted-foreground">Quét để truy cập</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
