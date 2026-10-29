'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import { DownloadIcon, CopyIcon, CheckCircleIcon, SparklesIcon } from '@/components/ui/Icons';

export function QrGeneratorTool() {
  const [qrType, setQrType] = useState<'url' | 'text' | 'wifi'>('url');
  const [content, setContent] = useState<string>('https://toolhub.id.vn');
  const [wifiSsid, setWifiSsid] = useState<string>('');
  const [wifiPassword, setWifiPassword] = useState<string>('');
  const [wifiEncryption, setWifiEncryption] = useState<string>('WPA');
  const [darkColor, setDarkColor] = useState<string>('#1e1b4b');
  const [lightColor, setLightColor] = useState<string>('#ffffff');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getEffectivePayload = useCallback((): string => {
    if (qrType === 'wifi') {
      return `WIFI:T:${wifiEncryption};S:${wifiSsid};P:${wifiPassword};;`;
    }
    return content || 'https://toolhub.id.vn';
  }, [qrType, content, wifiSsid, wifiPassword, wifiEncryption]);

  useEffect(() => {
    const payload = getEffectivePayload();
    if (!payload) return;

    QRCode.toDataURL(payload, {
      width: 480,
      margin: 2,
      color: {
        dark: darkColor,
        light: lightColor,
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => {});
  }, [getEffectivePayload, darkColor, lightColor]);

  const handleDownload = (format: 'png' | 'svg') => {
    const payload = getEffectivePayload();
    if (format === 'png' && qrDataUrl) {
      const link = document.createElement('a');
      link.download = `toolhub-qrcode.png`;
      link.href = qrDataUrl;
      link.click();
    } else if (format === 'svg') {
      QRCode.toString(payload, {
        type: 'svg',
        margin: 2,
        color: { dark: darkColor, light: lightColor },
      }).then((svgString) => {
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const link = document.createElement('a');
        link.download = `toolhub-qrcode.svg`;
        link.href = URL.createObjectURL(blob);
        link.click();
      });
    }
  };

  const handleCopy = async () => {
    if (!qrDataUrl) return;
    try {
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await navigator.clipboard.writeText(getEffectivePayload());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-7">
        <div className="flex gap-2 border-b border-border pb-3">
          {(
            [
              { id: 'url', label: 'Liên kết URL' },
              { id: 'text', label: 'Văn bản' },
              { id: 'wifi', label: 'Mạng Wi-Fi' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setQrType(tab.id);
                if (tab.id === 'url' && !content.startsWith('http')) {
                  setContent('https://');
                }
              }}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                qrType === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {qrType === 'url' && (
          <div className="space-y-2">
            <label htmlFor="url-input" className="text-xs font-medium text-foreground">
              Địa chỉ liên kết (URL)
            </label>
            <input
              id="url-input"
              type="url"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}

        {qrType === 'text' && (
          <div className="space-y-2">
            <label htmlFor="text-input" className="text-xs font-medium text-foreground">
              Nội dung văn bản
            </label>
            <textarea
              id="text-input"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập bất kỳ đoạn văn bản, ghi chú nào..."
              className="w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}

        {qrType === 'wifi' && (
          <div className="space-y-3">
            <div>
              <label htmlFor="wifi-ssid" className="text-xs font-medium text-foreground">
                Tên mạng Wi-Fi (SSID)
              </label>
              <input
                id="wifi-ssid"
                type="text"
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                placeholder="Ví dụ: Coffee_Free_Wifi"
                className="mt-1 w-full rounded-xl border border-input bg-card px-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="wifi-pass" className="text-xs font-medium text-foreground">
                Mật khẩu Wi-Fi
              </label>
              <input
                id="wifi-pass"
                type="text"
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                placeholder="Để trống nếu không có mật khẩu"
                className="mt-1 w-full rounded-xl border border-input bg-card px-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="wifi-enc" className="text-xs font-medium text-foreground">
                Chuẩn bảo mật
              </label>
              <select
                id="wifi-enc"
                value={wifiEncryption}
                onChange={(e) => setWifiEncryption(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input bg-card px-4 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="WPA">WPA / WPA2 / WPA3</option>
                <option value="WEP">WEP</option>
                <option value="nopass">Không có mật khẩu</option>
              </select>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
          <h4 className="text-xs font-semibold text-foreground">Tùy biến màu sắc</h4>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Màu mã QR</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={darkColor}
                  onChange={(e) => setDarkColor(e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent"
                />
                <input
                  type="text"
                  value={darkColor}
                  onChange={(e) => setDarkColor(e.target.value)}
                  className="w-full rounded-lg border border-input bg-card px-2.5 py-1 text-xs text-foreground"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Màu nền</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={lightColor}
                  onChange={(e) => setLightColor(e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent"
                />
                <input
                  type="text"
                  value={lightColor}
                  onChange={(e) => setLightColor(e.target.value)}
                  className="w-full rounded-lg border border-input bg-card px-2.5 py-1 text-xs text-foreground"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-5">
        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-white p-4 shadow-sm">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code Preview" className="h-64 w-64 object-contain" />
          ) : (
            <div className="flex h-64 w-64 items-center justify-center text-xs text-muted-foreground">
              Đang tạo mã QR...
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="mt-6 flex w-full flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDownload('png')}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-95"
            >
              <DownloadIcon className="h-4 w-4" />
              Tải ảnh PNG
            </button>
            <button
              type="button"
              onClick={() => handleDownload('svg')}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition-all hover:bg-muted"
            >
              <SparklesIcon className="h-4 w-4" />
              Tải vector SVG
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          >
            {copied ? (
              <>
                <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-500">Đã sao chép vào bộ nhớ tạm!</span>
              </>
            ) : (
              <>
                <CopyIcon className="h-4 w-4" />
                Sao chép hình ảnh
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
