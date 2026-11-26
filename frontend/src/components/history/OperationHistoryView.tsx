'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { OperationHistoryItem, OperationType, DateFilterType } from '@/types/history';
import { historyStorage } from '@/lib/history-storage';
import { ConfirmModal } from '@/components/account/ConfirmModal';
import {
  SearchIcon,
  ClockIcon,
  LinkIcon,
  QrCodeIcon,
  ImageIcon,
  DocumentIcon,
  CopyIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@/components/ui/Icons';

export function OperationHistoryView() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();

  const [items, setItems] = useState<OperationHistoryItem[]>([]);
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(0);
  const [selectedType, setSelectedType] = useState<OperationType | 'all' | 'file'>('all');
  const [selectedDate, setSelectedDate] = useState<DateFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Phân trang (Pagination)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentUserId = user?.id || 'guest_user';

  // Tải danh sách lịch sử theo user bất đồng bộ qua timer
  useEffect(() => {
    const timer = setTimeout(() => {
      const data = historyStorage.get(currentUserId);
      setItems(data);
      setCurrentTimestamp(Date.now());
    }, 0);

    return () => clearTimeout(timer);
  }, [currentUserId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast(t('common.copied') || 'Đã sao chép vào bộ nhớ tạm!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast('Đã sao chép!');
    }
  };

  const handleDeleteItem = (id: string) => {
    const updated = historyStorage.remove(currentUserId, id);
    setItems(updated);
    showToast('Đã xóa 1 bản ghi khỏi lịch sử');
  };

  const handleConfirmClearAll = () => {
    setIsDeletingAll(true);
    historyStorage.clear(currentUserId);
    setItems([]);
    setIsDeletingAll(false);
    setIsClearModalOpen(false);
    showToast('Đã xóa toàn bộ lịch sử thao tác');
  };

  // Tính số lượng theo từng loại
  const counts = useMemo(() => {
    return {
      all: items.length,
      link: items.filter((i) => i.type === 'link').length,
      qr: items.filter((i) => i.type === 'qr').length,
      file: items.filter((i) => i.type === 'image' || i.type === 'pdf').length,
    };
  }, [items]);

  // Bộ lọc dữ liệu theo Loại, Ngày và Từ khóa
  const filteredItems = useMemo(() => {
    const now = currentTimestamp || 0;
    const ONE_HOUR = 3600 * 1000;
    const ONE_DAY = 24 * ONE_HOUR;

    return items.filter((item) => {
      // 1. Lọc theo Loại (Type)
      let matchType = false;
      if (selectedType === 'all') matchType = true;
      else if (selectedType === 'file') matchType = item.type === 'image' || item.type === 'pdf';
      else matchType = item.type === selectedType;

      // 2. Lọc theo Ngày (Date)
      let matchDate = true;
      if (now > 0) {
        const diff = now - item.timestamp;
        if (selectedDate === 'today') matchDate = diff <= ONE_DAY;
        else if (selectedDate === '7days') matchDate = diff <= 7 * ONE_DAY;
        else if (selectedDate === '30days') matchDate = diff <= 30 * ONE_DAY;
      }

      // 3. Lọc theo từ khóa (Search)
      let matchSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        matchSearch =
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          (item.detail ? item.detail.toLowerCase().includes(q) : false);
      }

      return matchType && matchDate && matchSearch;
    });
  }, [items, selectedType, selectedDate, searchQuery, currentTimestamp]);

  // Tính toán phân trang
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, validCurrentPage, pageSize]);

  const formatTimestamp = (ts: number): string => {
    const now = currentTimestamp || ts;
    const diff = now - ts;
    const ONE_HOUR = 3600 * 1000;
    const ONE_DAY = 24 * ONE_HOUR;

    if (diff < 60 * 1000) return 'Vừa xong';
    if (diff < ONE_HOUR) return `${Math.floor(diff / (60 * 1000))} phút trước`;
    if (diff < ONE_DAY) return `${Math.floor(diff / ONE_HOUR)} giờ trước`;
    if (diff < 2 * ONE_DAY) return 'Hôm qua';

    const date = new Date(ts);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTypeIcon = (type: OperationType) => {
    switch (type) {
      case 'link':
        return <LinkIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'qr':
        return <QrCodeIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
      case 'image':
        return <ImageIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      case 'pdf':
        return <DocumentIcon className="h-5 w-5 text-rose-600 dark:text-rose-400" />;
      default:
        return <SparklesIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  const getTypeBadge = (type: OperationType) => {
    switch (type) {
      case 'link':
        return {
          label: 'LIÊN KẾT',
          cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
        };
      case 'qr':
        return {
          label: 'MÃ QR',
          cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
        };
      case 'image':
        return {
          label: 'HÌNH ẢNH',
          cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
        };
      case 'pdf':
        return {
          label: 'TÀI LIỆU PDF',
          cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
        };
      default:
        return {
          label: 'TIỆN ÍCH',
          cls: 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
        };
    }
  };

  // Trạng thái đang tải xác thực
  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span>{t('common.loading') || 'Đang tải lịch sử thao tác...'}</span>
        </div>
      </div>
    );
  }

  // Khuyến cáo đăng nhập nếu người dùng là khách
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Thông báo nếu chưa đăng nhập */}
      {!isAuthenticated && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 p-4 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <span className="text-base">⚠️</span>
            <span>
              Bạn đang xem lịch sử ở chế độ Khách (lưu tạm trên trình duyệt này). Hãy <strong>đăng nhập</strong> để lưu trữ lịch sử đồng bộ vĩnh viễn theo tài khoản.
            </span>
          </div>
          <Link
            href="/login?redirect=/history"
            className="shrink-0 rounded-xl bg-amber-600 px-3.5 py-1.5 font-semibold text-white transition hover:bg-amber-700 shadow-xs"
          >
            Đăng nhập ngay
          </Link>
        </div>
      )}

      {/* Header chính */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/70 px-3 py-0.5 text-xs font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 mb-1.5">
            <SparklesIcon className="h-3.5 w-3.5" />
            <span>FR-COM-03 • Thành viên</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Lịch sử thao tác
          </h1>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Xem lại, lọc và quản lý toàn bộ các liên kết, mã QR và tệp bạn đã xử lý trên ToolHub.
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => setIsClearModalOpen(true)}
            className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/30 px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 transition hover:bg-red-100 dark:hover:bg-red-900/40"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Xóa toàn bộ lịch sử
          </button>
        )}
      </div>

      {/* Thanh công cụ: Tìm kiếm & Bộ lọc ngày */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          {/* Ô tìm kiếm */}
          <div className="relative sm:col-span-7">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên tệp, đường dẫn liên kết, nội dung mã QR..."
              className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 py-2 pl-10 pr-4 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 transition focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Dropdown lọc theo Ngày */}
          <div className="flex items-center gap-2 sm:col-span-5">
            <ClockIcon className="h-4 w-4 shrink-0 text-neutral-400" />
            <select
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value as DateFilterType);
                setCurrentPage(1);
              }}
              className="w-full cursor-pointer rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 transition focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">📅 Tất cả thời gian</option>
              <option value="today">⚡ Hôm nay (24 giờ qua)</option>
              <option value="7days">🗓️ 7 ngày gần nhất</option>
              <option value="30days">📆 30 ngày gần nhất</option>
            </select>
          </div>
        </div>

        {/* Nút lọc theo Loại thao tác (Type Chips) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
          <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 mr-1">
            Phân loại:
          </span>

          <button
            type="button"
            onClick={() => {
              setSelectedType('all');
              setCurrentPage(1);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              selectedType === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'border border-neutral-200 dark:border-neutral-800 bg-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            Tất cả ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedType('link');
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              selectedType === 'link'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'border border-neutral-200 dark:border-neutral-800 bg-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            Liên kết ({counts.link})
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedType('qr');
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              selectedType === 'qr'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'border border-neutral-200 dark:border-neutral-800 bg-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <QrCodeIcon className="h-3.5 w-3.5" />
            Mã QR ({counts.qr})
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedType('file');
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              selectedType === 'file'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'border border-neutral-200 dark:border-neutral-800 bg-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <DocumentIcon className="h-3.5 w-3.5" />
            Tệp đã xử lý ({counts.file})
          </button>
        </div>
      </div>

      {/* Thông tin kết quả tìm kiếm */}
      <div className="flex items-center justify-between px-1 text-xs text-neutral-500 dark:text-neutral-400">
        <div>
          Hiển thị <span className="font-bold text-neutral-900 dark:text-white">{filteredItems.length}</span> / {items.length} thao tác
        </div>
        {(searchQuery || selectedType !== 'all' || selectedDate !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSelectedType('all');
              setSelectedDate('all');
              setSearchQuery('');
              setCurrentPage(1);
            }}
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Đặt lại bộ lọc
          </button>
        )}
      </div>

      {/* Danh sách các bản ghi lịch sử */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-2xl dark:bg-neutral-800">
            📭
          </div>
          <h3 className="mt-3 text-base font-bold text-neutral-900 dark:text-white">
            Không tìm thấy thao tác nào phù hợp
          </h3>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
            Không có kết quả nào khớp với bộ lọc loại, mốc thời gian hoặc từ khóa tìm kiếm của bạn.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedType('all');
                setSelectedDate('all');
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-card px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              Xóa bộ lọc
            </button>
            <Link
              href="/"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
            >
              Khám phá tiện ích
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedItems.map((item) => {
            const badge = getTypeBadge(item.type);
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-xs transition hover:border-indigo-500/40 hover:shadow-md"
              >
                {/* Thông tin chính */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 transition group-hover:scale-105">
                    {renderTypeIcon(item.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                        {item.title}
                      </span>
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>
                        {badge.label}
                      </span>
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
                        • ⏱️ {formatTimestamp(item.timestamp)}
                      </span>
                    </div>

                    <div className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate select-all">
                      {item.summary}
                    </div>

                    {item.detail && (
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        {item.detail}
                      </p>
                    )}
                  </div>
                </div>

                {/* Các nút thao tác nhanh (Quick actions) */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800/80 pt-2.5 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(item.id, item.summary)}
                    title="Sao chép kết quả"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-card px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  >
                    {isCopied ? (
                      <>
                        <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon className="h-3.5 w-3.5" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    title="Xóa bản ghi này"
                    className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-card p-2 text-neutral-400 hover:border-red-500/50 hover:text-red-600 dark:hover:text-red-400 transition"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Điều khiển phân trang (Pagination Controls) */}
      {filteredItems.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3 shadow-xs">
          <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
            <span>
              Hiển thị{' '}
              <span className="font-semibold text-neutral-900 dark:text-white">
                {(validCurrentPage - 1) * pageSize + 1} - {Math.min(validCurrentPage * pageSize, filteredItems.length)}
              </span>{' '}
              trên tổng số{' '}
              <span className="font-semibold text-neutral-900 dark:text-white">
                {filteredItems.length}
              </span>
            </span>

            <div className="flex items-center gap-1.5 border-l border-neutral-200 dark:border-neutral-800 pl-3">
              <span>Mỗi trang:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-2 py-1 text-xs font-semibold text-neutral-700 dark:text-neutral-300 focus:border-indigo-500 focus:outline-hidden"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-800 bg-card text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Trang trước"
              >
                ‹
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (totalPages <= 7) return true;
                  if (page === 1 || page === totalPages) return true;
                  return Math.abs(page - validCurrentPage) <= 1;
                })
                .map((page, idx, arr) => {
                  const prev = arr[idx - 1];
                  return (
                    <React.Fragment key={page}>
                      {prev && page - prev > 1 && (
                        <span className="px-1 text-xs text-neutral-400 select-none">...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-8 h-8 rounded-lg px-2 text-xs font-semibold transition ${
                          validCurrentPage === page
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'border border-neutral-200 dark:border-neutral-800 bg-card text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-800 bg-card text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Trang sau"
              >
                ›
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal xác nhận xóa toàn bộ lịch sử (Tái sử dụng ConfirmModal) */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Xóa toàn bộ lịch sử thao tác?"
        description="Toàn bộ lịch sử liên kết, mã QR và tệp đã xử lý của bạn sẽ bị xóa hoàn toàn khỏi thiết bị này. Hành động này không thể hoàn tác."
        confirmText="Xóa sạch lịch sử"
        cancelText="Hủy"
        isLoading={isDeletingAll}
        onConfirm={handleConfirmClearAll}
        onCancel={() => setIsClearModalOpen(false)}
      />

      {/* Toast thông báo nhanh */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl dark:bg-white dark:text-neutral-900 animate-in fade-in slide-in-from-bottom-2">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
