'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AbuseReportItem,
  AbuseReportReason,
  AbuseReportStatus,
  getAdminReports,
  updateAdminReport,
} from '@/lib/report-api';

const REASON_BADGES: Record<
  AbuseReportReason,
  { label: string; bg: string; text: string; border: string }
> = {
  PHISHING: {
    label: 'Lừa đảo / Phishing',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
  },
  MALWARE: {
    label: 'Mã độc / Malware',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
  SPAM: {
    label: 'Spam / Rác',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  ADULT: {
    label: 'Nội dung NSFW',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
  COPYRIGHT: {
    label: 'Bản quyền',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  OTHER: {
    label: 'Lý do khác',
    bg: 'bg-neutral-100 dark:bg-neutral-800',
    text: 'text-neutral-700 dark:text-neutral-300',
    border: 'border-neutral-200 dark:border-neutral-700',
  },
};

const STATUS_BADGES: Record<
  AbuseReportStatus,
  { label: string; bg: string }
> = {
  PENDING: {
    label: 'Chờ duyệt',
    bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  },
  RESOLVED: {
    label: 'Đã xử lý vi phạm',
    bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  },
  DISMISSED: {
    label: 'Đã bác bỏ',
    bg: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  },
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AbuseReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AbuseReportStatus | 'ALL'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pendingCount: 0,
    resolvedCount: 0,
    dismissedCount: 0,
  });

  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getAdminReports({
        status: activeTab,
        search: searchQuery.trim() || undefined,
      });
      setReports(data.reports);
      setStats({
        total: data.total,
        pendingCount: data.pendingCount,
        resolvedCount: data.resolvedCount,
        dismissedCount: data.dismissedCount,
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Không thể tải hàng đợi báo cáo';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReports();
    }, 100);
    return () => clearTimeout(timer);
  }, [fetchReports]);

  const handleAction = async (
    reportId: string,
    action: 'DISABLE_LINK' | 'DELETE_LINK' | 'DISMISS',
    noteText = '',
  ) => {
    setActioningId(reportId);
    setErrorMsg(null);
    try {
      const newStatus: AbuseReportStatus =
        action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED';

      await updateAdminReport(reportId, {
        status: newStatus,
        action,
        adminNotes: noteText || undefined,
      });

      const actionText =
        action === 'DISABLE_LINK'
          ? 'Đã khóa liên kết và cập nhật báo cáo thành công'
          : action === 'DELETE_LINK'
            ? 'Đã xóa liên kết khỏi hệ thống'
            : 'Đã bác bỏ báo cáo vi phạm';

      setSuccessToast(actionText);
      setTimeout(() => setSuccessToast(null), 4000);
      await fetchReports();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Thao tác không thành công';
      setErrorMsg(msg);
    } finally {
      setActioningId(null);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                Admin Queue
              </span>
              <span className="text-xs text-neutral-400 font-mono">FR-URL-11</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight mt-1">
              Hàng đợi kiểm duyệt báo cáo vi phạm
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Tiếp nhận, kiểm tra và vô hiệu hoá các liên kết rút gọn vi phạm chính sách hoặc phát tán mã độc
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/links"
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              Quản lý link
            </Link>
            <button
              type="button"
              onClick={fetchReports}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm mới
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-fade-in shadow-sm">
            <span>{successToast}</span>
            <button
              type="button"
              onClick={() => setSuccessToast(null)}
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 ml-4"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-700 dark:text-rose-400">
            {errorMsg}
          </div>
        )}

        {/* Metric Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-1">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              Tổng số báo cáo
            </span>
            <div className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">
              {stats.total}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-900/40 shadow-sm space-y-1">
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Chờ xử lý (Pending)
            </span>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {stats.pendingCount}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-900/40 shadow-sm space-y-1">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Đã xử lý (Khóa link)
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats.resolvedCount}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-1">
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              Đã bác bỏ
            </span>
            <div className="text-2xl font-extrabold text-neutral-700 dark:text-neutral-300">
              {stats.dismissedCount}
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-1 overflow-x-auto p-1">
            {(
              [
                { key: 'PENDING', label: `Chờ duyệt (${stats.pendingCount})` },
                { key: 'RESOLVED', label: `Đã xử lý (${stats.resolvedCount})` },
                { key: 'DISMISSED', label: `Bác bỏ (${stats.dismissedCount})` },
                { key: 'ALL', label: `Tất cả (${stats.total})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative sm:w-64 pr-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo slug, URL, lý do..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <svg
              className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Reports Queue Table / Cards */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-16 text-center text-xs text-neutral-400 space-y-2">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Đang tải danh sách báo cáo...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                Không có báo cáo nào
              </h3>
              <p className="text-xs text-neutral-500">
                Hàng đợi kiểm duyệt hiện tại đang trống hoặc không có kết quả khớp với bộ lọc.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {reports.map((report) => {
                const badge = REASON_BADGES[report.reason] || REASON_BADGES.OTHER;
                const statusBadge = STATUS_BADGES[report.status] || STATUS_BADGES.PENDING;
                const isActioning = actioningId === report.id;

                return (
                  <div
                    key={report.id}
                    className="p-5 sm:p-6 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/s/${report.slug}`}
                          target="_blank"
                          className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          /{report.slug}
                        </Link>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold ${statusBadge.bg}`}
                        >
                          {statusBadge.label}
                        </span>
                        {report.actionTaken && report.actionTaken !== 'NONE' && (
                          <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            {report.actionTaken === 'DISABLED'
                              ? 'Đã khoá link'
                              : 'Đã xoá'}
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-neutral-400 font-mono">
                        {new Date(report.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                          URL đích:
                        </span>
                        <a
                          href={report.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-xl"
                        >
                          {report.targetUrl}
                        </a>
                      </div>

                      {report.details && (
                        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 mt-2">
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                            Mô tả từ người báo cáo:
                          </span>{' '}
                          {report.details}
                        </div>
                      )}

                      {report.adminNotes && (
                        <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300">
                          <span className="font-semibold">Ghi chú xử lý:</span>{' '}
                          {report.adminNotes} (bởi {report.resolvedBy || 'admin'})
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-neutral-400 pt-1">
                        {report.reporterEmail && (
                          <span>
                            Email: <span className="font-mono">{report.reporterEmail}</span>
                          </span>
                        )}
                        <span>
                          IP Hash (BR-URL-03):{' '}
                          <span className="font-mono truncate max-w-[120px] inline-block align-bottom">
                            {report.reporterIpHash}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    {report.status === 'PENDING' && (
                      <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={isActioning}
                          onClick={() =>
                            handleAction(
                              report.id,
                              'DISABLE_LINK',
                              'Đã xác minh và vô hiệu hoá liên kết vi phạm.',
                            )
                          }
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          Khóa link vi phạm
                        </button>

                        <button
                          type="button"
                          disabled={isActioning}
                          onClick={() =>
                            handleAction(
                              report.id,
                              'DELETE_LINK',
                              'Xóa liên kết theo yêu cầu vi phạm nghiêm trọng.',
                            )
                          }
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-50"
                        >
                          Xóa link
                        </button>

                        <button
                          type="button"
                          disabled={isActioning}
                          onClick={() =>
                            handleAction(
                              report.id,
                              'DISMISS',
                              'Báo cáo không có căn cứ vi phạm.',
                            )
                          }
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition disabled:opacity-50"
                        >
                          Bác bỏ báo cáo
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
