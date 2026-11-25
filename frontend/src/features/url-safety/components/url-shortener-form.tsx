'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { SafetyIcon } from './safety-icons';
import { checkUrlSafety } from '../lib/check-url-safety';
import type {
  ShortenedLinkRecord,
  UrlViolationKind,
} from '../types/url-safety.types';

export function UrlShortenerForm() {
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [customSlug, setCustomSlug] = useState<string>('');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [rejection, setRejection] = useState<{
    kind: UrlViolationKind;
    reason: string;
    threatDetail?: string;
  } | null>(null);
  const [shortenedRecord, setShortenedRecord] =
    useState<ShortenedLinkRecord | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [history, setHistory] = useState<ShortenedLinkRecord[]>([]);
  const [duplicatePrompt, setDuplicatePrompt] =
    useState<ShortenedLinkRecord | null>(null);

  const generateSafeSlug = (): string => {
    const charset = 'abcdefghjkmnpqrstuvwxyz23456789';
    let slug = '';
    for (let i = 0; i < 7; i++) {
      slug += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return slug;
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setTargetUrl(text.trim());
        setRejection(null);
      }
    } catch {
      return;
    }
  };

  const executeShortenProcess = async (
    normalizedUrl: string,
    forcedSlug?: string,
  ) => {
    try {
      const slug =
        forcedSlug ||
        customSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '') ||
        generateSafeSlug();

      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : 'https://toolhub.id.vn';
      const shortUrl = `${origin}/${slug}`;

      const qrCodeDataUrl = await QRCode.toDataURL(shortUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });

      const now = new Date();
      const expirationDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const record: ShortenedLinkRecord = {
        id: `link_${Date.now()}`,
        originalUrl: normalizedUrl,
        slug,
        shortUrl,
        qrCodeDataUrl,
        createdAt: now.toISOString(),
        expiresAt: expirationDate.toISOString(),
        isGuest: true,
        clickCount: 0,
      };

      setShortenedRecord(record);
      setHistory((prev) => [record, ...prev]);
      setRejection(null);
      setDuplicatePrompt(null);
    } catch {
      setRejection({
        kind: 'INVALID_FORMAT',
        reason:
          'Đã có lỗi xảy ra trong quá trình tạo liên kết rút gọn. Vui lòng thử lại.',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRejection(null);
    setDuplicatePrompt(null);

    let input = targetUrl.trim();
    if (!input) {
      setRejection({
        kind: 'INVALID_FORMAT',
        reason: 'Vui lòng nhập địa chỉ liên kết cần rút gọn.',
      });
      return;
    }

    if (!input.startsWith('http://') && !input.startsWith('https://')) {
      input = 'https://' + input;
    }

    setIsChecking(true);

    const checkResult = await checkUrlSafety(input);

    if (!checkResult.ok) {
      setIsChecking(false);
      setShortenedRecord(null);
      setRejection({
        kind: checkResult.kind,
        reason: checkResult.reason,
        threatDetail: checkResult.threatDetail,
      });
      return;
    }

    const existingMatch = history.find(
      (h) => h.originalUrl === checkResult.normalizedUrl,
    );
    if (existingMatch && !customSlug.trim()) {
      setIsChecking(false);
      setDuplicatePrompt(existingMatch);
      return;
    }

    await executeShortenProcess(checkResult.normalizedUrl);
  };

  const handleCopy = async () => {
    if (!shortenedRecord) return;
    try {
      await navigator.clipboard.writeText(shortenedRecord.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      return;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 dark:border-sky-900/60 dark:bg-sky-950/30">
        <div className="flex items-start gap-3">
          <SafetyIcon
            name="info"
            className="h-5 w-5 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0"
          />
          <div className="text-xs space-y-1 text-sky-900 dark:text-sky-200">
            <p className="font-semibold">
              Quy tắc sử dụng & bảo mật (BR-URL-01, BR-URL-03):
            </p>
            <p>
              Liên kết được tạo ở chế độ <strong>Khách (Guest)</strong> không thể chỉnh sửa hoặc xoá, và sẽ tự động hết hạn sau <strong>30 ngày</strong> nếu không có lượt nhấp.
            </p>
            <p>
              Hệ thống tuyệt đối <strong>không lưu địa chỉ IP thô</strong> khi thống kê lượt nhấp, bảo đảm an toàn dữ liệu cá nhân theo quy định.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-6"
      >
        <div>
          <label
            htmlFor="target-url-input"
            className="block text-sm font-semibold text-foreground mb-2"
          >
            Nhập liên kết đích (URL) cần rút gọn
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                <SafetyIcon name="link" className="h-4 w-4" />
              </div>
              <input
                id="target-url-input"
                type="text"
                value={targetUrl}
                onChange={(e) => {
                  setTargetUrl(e.target.value);
                  if (rejection) setRejection(null);
                }}
                placeholder="https://example.com/duong-dan-bai-viet-rat-dai-can-rut-gon"
                className="w-full rounded-xl border border-input bg-background pl-10 pr-24 py-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={isChecking}
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                title="Dán từ Clipboard"
              >
                Dán URL
              </button>
            </div>

            <button
              id="shorten-submit-btn"
              type="submit"
              disabled={isChecking}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-95 disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {isChecking ? (
                <>
                  <SafetyIcon
                    name="refresh"
                    className="h-4 w-4 animate-spin"
                  />
                  <span>Đang kiểm tra...</span>
                </>
              ) : (
                <>
                  <SafetyIcon name="sparkles" className="h-4 w-4" />
                  <span>Rút gọn link</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
          <label
            htmlFor="custom-slug-input"
            className="block text-xs font-semibold text-foreground mb-1.5"
          >
            Tùy biến phần đuôi link (Slug)
          </label>
          <div className="flex items-center gap-2 max-w-md">
            <span className="text-xs font-mono text-muted-foreground shrink-0">
              toolhub.id.vn/
            </span>
            <input
              id="custom-slug-input"
              type="text"
              value={customSlug}
              onChange={(e) =>
                setCustomSlug(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''),
                )
              }
              placeholder="slug-tuy-chinh-3-32-ky-tu"
              maxLength={32}
              className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Để trống để hệ thống tự tạo mã ngẫu nhiên 7 ký tự an toàn, không chứa ký tự dễ nhầm lẫn.
          </p>
        </div>

        {rejection && (
          <div
            id="url-safety-rejection-alert"
            role="alert"
            aria-live="assertive"
            className="rounded-2xl border-2 border-rose-500/40 bg-rose-50 p-5 dark:border-rose-900/60 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100 shadow-sm"
          >
            <div className="flex items-start gap-3.5">
              <div className="rounded-xl bg-rose-100 p-2 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400 shrink-0">
                <SafetyIcon name="shield-alert" className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-rose-800 dark:text-rose-200">
                    Từ chối tạo liên kết rút gọn
                  </h3>
                  <span className="rounded-full bg-rose-200/80 dark:bg-rose-800/60 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-rose-800 dark:text-rose-200">
                    {rejection.kind}
                  </span>
                </div>
                <p className="text-xs leading-relaxed font-medium">
                  {rejection.reason}
                </p>
                {rejection.threatDetail && (
                  <p className="text-xs text-rose-700/90 dark:text-rose-300/90 italic">
                    Chi tiết: {rejection.threatDetail}
                  </p>
                )}
                <p className="text-[11px] text-rose-600 dark:text-rose-400 pt-1">
                  Hệ thống không tạo link cho liên kết này nhằm bảo vệ người dùng và tuân thủ tiêu chuẩn an toàn ToolHub.
                </p>
              </div>
            </div>
          </div>
        )}

        {duplicatePrompt && (
          <div
            role="status"
            className="rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100"
          >
            <div className="flex items-start gap-3">
              <SafetyIcon
                name="alert-triangle"
                className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
              />
              <div className="space-y-3">
                <p className="text-xs font-medium">
                  <strong>Xác nhận liên kết trùng (BR-URL-02):</strong> Bạn đã từng rút gọn URL này trong phiên hiện tại với link ngắn:{' '}
                  <span className="font-mono font-semibold text-primary">
                    {duplicatePrompt.shortUrl}
                  </span>.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShortenedRecord(duplicatePrompt);
                      setDuplicatePrompt(null);
                    }}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
                  >
                    Dùng lại liên kết cũ
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      executeShortenProcess(
                        duplicatePrompt.originalUrl,
                        generateSafeSlug(),
                      )
                    }
                    className="rounded-lg border border-amber-400 bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    Tạo liên kết mới
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>

      {shortenedRecord && (
        <div
          id="shortened-result-card"
          className="rounded-2xl border border-emerald-300/60 bg-card p-6 md:p-8 shadow-sm dark:border-emerald-800/40"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
              <SafetyIcon name="shield-check" className="h-3.5 w-3.5" />
              Đã kiểm tra an toàn & Rút gọn thành công
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Liên kết rút gọn của bạn
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shortenedRecord.shortUrl}
                    className="flex-1 rounded-xl border border-input bg-muted px-3.5 py-2.5 font-mono text-sm font-bold text-primary shadow-inner select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-opacity shrink-0 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <SafetyIcon name="check" className="h-4 w-4" />
                        <span>Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <SafetyIcon name="copy" className="h-4 w-4" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                  <a
                    href={shortenedRecord.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-border bg-card p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Mở URL gốc thử nghiệm"
                  >
                    <SafetyIcon name="external-link" className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p className="truncate">
                  <strong className="text-foreground">Đích:</strong>{' '}
                  <span className="font-mono">{shortenedRecord.originalUrl}</span>
                </p>
                <p>
                  <strong className="text-foreground">Hạn sử dụng:</strong>{' '}
                  {new Date(shortenedRecord.expiresAt).toLocaleDateString('vi-VN')} (30 ngày không có lượt nhấp)
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-3 rounded-2xl border border-border/80 bg-muted/30">
              <Image
                src={shortenedRecord.qrCodeDataUrl}
                alt="Mã QR liên kết rút gọn"
                width={128}
                height={128}
                unoptimized
                className="h-32 w-32 rounded-xl bg-white p-2 shadow-sm"
              />
              <span className="text-[11px] text-muted-foreground mt-2 font-medium">
                Mã QR cho link rút gọn
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
