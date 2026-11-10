'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { LinkItem } from '@/types/link';
import {
  createShortLink,
  deleteShortLink,
  fetchLinks,
  updateShortLink,
} from '@/lib/link-api';
import { UtmBuilderModal } from './UtmBuilderModal';

export function LinkManagement() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [originalUrl, setOriginalUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [showCustomSlug, setShowCustomSlug] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isUtmModalOpen, setIsUtmModalOpen] = useState(false);

  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [deletingLink, setDeletingLink] = useState<LinkItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadLinks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchLinks(search);
      setLinks(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tải danh sách link';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLinks();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadLinks]);

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalUrl.trim()) return;

    try {
      setIsSubmitting(true);
      const newLink = await createShortLink({
        originalUrl: originalUrl.trim(),
        customSlug: showCustomSlug && customSlug.trim() ? customSlug.trim() : undefined,
      });

      showToast(`Đã tạo link ngắn thành công: /s/${newLink.slug}`);
      setOriginalUrl('');
      setCustomSlug('');
      setShowCustomSlug(false);
      await loadLinks();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi tạo liên kết';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (link: LinkItem) => {
    const nextStatus = !link.isActive;
    setLinks((prev) =>
      prev.map((l) => (l.id === link.id ? { ...l, isActive: nextStatus } : l)),
    );

    try {
      await updateShortLink(link.id, { isActive: nextStatus });
      showToast(nextStatus ? 'Đã bật hoạt động liên kết' : 'Đã tạm tắt liên kết');
    } catch (err: unknown) {
      setLinks((prev) =>
        prev.map((l) => (l.id === link.id ? { ...l, isActive: link.isActive } : l)),
      );
      const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái';
      showToast(msg, 'error');
    }
  };

  const handleUpdateUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink || !editUrl.trim()) return;

    try {
      setIsUpdating(true);
      const updated = await updateShortLink(editingLink.id, { originalUrl: editUrl.trim() });
      setLinks((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      showToast('Cập nhật URL đích thành công');
      setEditingLink(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật URL';
      showToast(msg, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingLink) return;

    try {
      setIsDeleting(true);
      await deleteShortLink(deletingLink.id);
      setLinks((prev) => prev.filter((l) => l.id !== deletingLink.id));
      showToast('Đã xóa liên kết thành công');
      setDeletingLink(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi xóa liên kết';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyLink = (slug: string) => {
    const fullUrl = `${window.location.origin}/s/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    showToast('Đã sao chép liên kết vào bộ nhớ tạm');
  };

  const stats = useMemo(() => {
    const total = links.length;
    const active = links.filter((l) => l.isActive).length;
    const clicks = links.reduce((acc, curr) => acc + curr.totalClicks, 0);
    return { total, active, clicks };
  }, [links]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 ${
            toast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">
            Quản lý liên kết rút gọn
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Rút gọn URL, theo dõi lượt click và quản lý trạng thái liên kết của bạn
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase">Tổng số liên kết</p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase">Đang hoạt động</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.active}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase">Tổng lượt nhấp</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{stats.clicks}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
          Tạo liên kết rút gọn mới
        </h2>

        <form onSubmit={handleCreateLink} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-3 text-neutral-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </span>
              <input
                type="url"
                required
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                placeholder="Dán đường dẫn dài vào đây (https://example.com/very-long-url...)"
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !originalUrl.trim()}
              className="py-2.5 px-6 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-sm transition flex-shrink-0"
            >
              {isSubmitting ? 'Đang tạo...' : 'Rút gọn link'}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
            <button
              type="button"
              onClick={() => setIsUtmModalOpen(true)}
              className="inline-flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>Gắn tham số UTM chiến dịch (Google Analytics)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCustomSlug(!showCustomSlug)}
              className="font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition"
            >
              {showCustomSlug ? '– Ẩn mã tùy chỉnh' : '+ Thêm mã rút gọn tùy chỉnh'}
            </button>
          </div>

          {showCustomSlug && (
            <div className="pt-2 animate-in fade-in duration-150">
              <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                Mã rút gọn tùy chỉnh (Slug):
              </label>
              <div className="mt-1 flex items-center">
                <span className="px-3 py-2 text-xs font-mono bg-neutral-100 dark:bg-neutral-800 border border-r-0 border-neutral-200 dark:border-neutral-800 rounded-l-xl text-neutral-500">
                  /s/
                </span>
                <input
                  type="text"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  placeholder="vi-du-sale-2026"
                  className="w-full sm:w-64 px-3 py-2 text-xs font-mono rounded-r-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          )}
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            Danh sách liên kết ({links.length})
          </h2>

          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-2.5 text-neutral-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm link, mã slug..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm text-neutral-400">
            Đang tải danh sách liên kết...
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-12 p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              Chưa có liên kết nào
            </h3>
            <p className="text-xs text-neutral-400">
              Dán URL dài ở phía trên để tạo link ngắn đầu tiên của bạn
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map((link) => (
              <div
                key={link.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                      /s/{link.slug}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(link.slug)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 hover:bg-blue-100 transition"
                      title="Sao chép liên kết"
                    >
                      Copy
                    </button>
                    {!link.isActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                        Đang tạm tắt
                      </span>
                    )}
                  </div>

                  <p
                    className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-xl"
                    title={link.originalUrl}
                  >
                    → {link.originalUrl}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-neutral-400 pt-1">
                    <span>Lượt nhấp: <strong className="text-neutral-700 dark:text-neutral-300 font-semibold">{link.totalClicks}</strong></span>
                    <span>•</span>
                    <span>Tạo lúc: {new Date(link.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(link)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      link.isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 hover:bg-emerald-100'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200'
                    }`}
                  >
                    {link.isActive ? 'Đang Bật' : 'Đang Tắt'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingLink(link);
                      setEditUrl(link.originalUrl);
                    }}
                    className="p-2 rounded-xl text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-xs flex items-center gap-1"
                    title="Chỉnh sửa URL đích"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span>Sửa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingLink(link)}
                    className="p-2 rounded-xl text-neutral-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition text-xs flex items-center gap-1"
                    title="Xóa link này"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <UtmBuilderModal
        isOpen={isUtmModalOpen}
        onClose={() => setIsUtmModalOpen(false)}
        originalUrl={originalUrl}
        onApply={(finalUrl) => setOriginalUrl(finalUrl)}
      />

      {editingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Chỉnh sửa URL đích cho mã /{editingLink.slug}
            </h3>
            <form onSubmit={handleUpdateUrl} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                  URL đích mới:
                </label>
                <input
                  type="url"
                  required
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="mt-1 w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLink(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !editUrl.trim()}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Xác nhận xóa liên kết?
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Liên kết <strong className="font-mono text-neutral-700 dark:text-neutral-300">/s/{deletingLink.slug}</strong> sẽ bị xóa vĩnh viễn và không thể khôi phục.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingLink(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeleting ? 'Đang xóa...' : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
