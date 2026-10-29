'use client';

import { useState } from 'react';
import { UtmParams } from '@/types/link';
import { buildUrlWithUtm } from '@/lib/link-api';

interface UtmBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalUrl: string;
  onApply: (finalUrl: string) => void;
}

const POPULAR_SOURCES = ['facebook', 'google', 'tiktok', 'youtube', 'zalo', 'email'];
const POPULAR_MEDIUMS = ['cpc', 'social', 'banner', 'bio_link', 'newsletter'];

export function UtmBuilderModal({
  isOpen,
  onClose,
  originalUrl,
  onApply,
}: UtmBuilderModalProps) {
  const [utm, setUtm] = useState<UtmParams>({
    source: '',
    medium: '',
    campaign: '',
    term: '',
    content: '',
  });

  if (!isOpen) return null;

  const previewUrl = originalUrl
    ? buildUrlWithUtm(originalUrl, utm)
    : 'Vui lòng nhập URL gốc trước khi xem trước';

  const handleApply = () => {
    if (!originalUrl.trim()) return;
    const finalUrl = buildUrlWithUtm(originalUrl, utm);
    onApply(finalUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>Trình tạo tham số chiến dịch (UTM)</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Theo dõi hiệu quả chiến dịch tiếp thị qua Google Analytics
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Nguồn chiến dịch (<code className="text-blue-600 font-mono">utm_source</code>)*
            </label>
            <input
              type="text"
              value={utm.source}
              onChange={(e) => setUtm({ ...utm, source: e.target.value })}
              placeholder="ví dụ: facebook, google, tiktok..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {POPULAR_SOURCES.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setUtm({ ...utm, source: src })}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition ${
                    utm.source === src
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                  }`}
                >
                  +{src}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Hình thức (<code className="text-blue-600 font-mono">utm_medium</code>)*
            </label>
            <input
              type="text"
              value={utm.medium}
              onChange={(e) => setUtm({ ...utm, medium: e.target.value })}
              placeholder="ví dụ: cpc, social, bio_link..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {POPULAR_MEDIUMS.map((med) => (
                <button
                  key={med}
                  type="button"
                  onClick={() => setUtm({ ...utm, medium: med })}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition ${
                    utm.medium === med
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                  }`}
                >
                  +{med}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Tên chiến dịch (<code className="text-blue-600 font-mono">utm_campaign</code>)*
            </label>
            <input
              type="text"
              value={utm.campaign}
              onChange={(e) => setUtm({ ...utm, campaign: e.target.value })}
              placeholder="ví dụ: khuyen_mai_2026, ra_mat_san_pham..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Nội dung phân biệt A/B (<code className="text-blue-600 font-mono">utm_content</code>) - Tuỳ chọn
            </label>
            <input
              type="text"
              value={utm.content || ''}
              onChange={(e) => setUtm({ ...utm, content: e.target.value })}
              placeholder="ví dụ: banner_top, nut_mua_hang..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="pt-2">
            <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Xem trước URL đích sau khi gắn UTM:
            </label>
            <div className="mt-1 p-3 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 font-mono text-xs text-blue-600 dark:text-blue-400 break-all select-all">
              {previewUrl}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!utm.source.trim()}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-sm transition"
          >
            Áp dụng UTM vào link
          </button>
        </div>
      </div>
    </div>
  );
}
