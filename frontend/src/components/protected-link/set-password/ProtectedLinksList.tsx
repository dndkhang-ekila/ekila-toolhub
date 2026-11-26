'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtectedLinkMeta } from '@/types/protected-link';
import { CopyIcon, LockIcon } from '@/components/ui/Icons';
import {
  ExternalLinkIcon,
  KeyIcon,
  TrashIcon,
  copyTextToClipboard,
} from '../ProtectedLinkIcons';

interface ProtectedLinksListProps {
  protectedList: Record<string, ProtectedLinkMeta>;
  onEdit: (slug: string, originalUrl?: string) => void;
  onRemove: (slug: string) => void;
  onSelectSlugToUnlock?: (slug: string) => void;
}

/**
 * Danh sách các liên kết đang được bảo vệ bằng mật khẩu cùng các thao tác nhanh.
 */
export function ProtectedLinksList({
  protectedList,
  onEdit,
  onRemove,
  onSelectSlugToUnlock,
}: ProtectedLinksListProps) {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const protectedSlugs = Object.keys(protectedList);

  const handleCopyUnlockUrl = async (itemSlug: string) => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/protected-link/unlock-gate/${encodeURIComponent(itemSlug)}`;
    if (await copyTextToClipboard(url)) {
      setCopiedSlug(itemSlug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        Liên kết đang bảo vệ ({protectedSlugs.length})
      </h3>

      {protectedSlugs.length === 0 ? (
        <div className="py-6 text-center space-y-1.5 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Chưa có liên kết nào được cài mật khẩu.
          </p>
          <p className="text-[11px] text-neutral-400">
            Nhập URL gốc hoặc mã slug ở biểu mẫu phía trên để tạo liên kết bảo vệ đầu tiên.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
          {protectedSlugs.map((itemSlug) => {
            const meta = protectedList[itemSlug];
            return (
              <div
                key={itemSlug}
                className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-indigo-600 dark:text-indigo-400">
                      <LockIcon className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-mono font-bold text-xs text-neutral-900 dark:text-white truncate">
                      /s/{itemSlug}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Cập nhật {new Date(meta.updatedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  {meta?.originalUrl && (
                    <p
                      className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate pl-5"
                      title={meta.originalUrl}
                    >
                      {meta.originalUrl}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyUnlockUrl(itemSlug)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                  >
                    <CopyIcon className="w-3 h-3" />
                    <span>{copiedSlug === itemSlug ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(itemSlug, meta?.originalUrl)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                  >
                    <KeyIcon className="w-3 h-3" />
                    <span>Đổi MK</span>
                  </button>
                  {onSelectSlugToUnlock ? (
                    <button
                      type="button"
                      onClick={() => onSelectSlugToUnlock(itemSlug)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition cursor-pointer"
                    >
                      <span>Mở khóa</span>
                      <ExternalLinkIcon className="w-3 h-3" />
                    </button>
                  ) : (
                    <Link
                      href={`/protected-link/unlock-gate/${encodeURIComponent(itemSlug)}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition"
                    >
                      <span>Mở khóa</span>
                      <ExternalLinkIcon className="w-3 h-3" />
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemove(itemSlug)}
                    className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    title="Gỡ bỏ mật khẩu"
                    aria-label={`Gỡ bỏ mật khẩu cho /s/${itemSlug}`}
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
