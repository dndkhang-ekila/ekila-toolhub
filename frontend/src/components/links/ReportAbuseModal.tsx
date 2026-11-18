'use client';

import React, { useState } from 'react';
import {
  AbuseReportReason,
  submitAbuseReport,
} from '@/lib/report-api';

interface ReportAbuseModalProps {
  slug: string;
  targetUrl?: string;
  isOpen: boolean;
  onClose: () => void;
}

const REASONS: { value: AbuseReportReason; label: string; desc: string }[] = [
  {
    value: 'PHISHING',
    label: 'Lừa đảo / Giả mạo (Phishing)',
    desc: 'Trang web mạo danh thương hiệu, đánh cắp mật khẩu hoặc thông tin thẻ.',
  },
  {
    value: 'MALWARE',
    label: 'Mã độc / Virus (Malware)',
    desc: 'Tự động tải xuống virus, trojan, mã độc hại vào thiết bị người dùng.',
  },
  {
    value: 'SPAM',
    label: 'Tin nhắn rác / Lừa đảo tiền bạc (Spam)',
    desc: 'Đường dẫn rác phát tán số lượng lớn, lừa đảo tài chính hoặc nạp thẻ.',
  },
  {
    value: 'ADULT',
    label: 'Nội dung khiêu dâm / Đồi trụy (NSFW)',
    desc: 'Nội dung người lớn, bạo lực hoặc không phù hợp với tiêu chuẩn cộng đồng.',
  },
  {
    value: 'COPYRIGHT',
    label: 'Vi phạm bản quyền tác giả',
    desc: 'Sử dụng hình ảnh, sản phẩm, thương hiệu vi phạm quyền sở hữu trí tuệ.',
  },
  {
    value: 'OTHER',
    label: 'Vi phạm quy định khác',
    desc: 'Hành vi vi phạm pháp luật hoặc điều khoản dịch vụ của ToolHub.',
  },
];

export function ReportAbuseModal({
  slug,
  targetUrl,
  isOpen,
  onClose,
}: ReportAbuseModalProps) {
  const [reason, setReason] = useState<AbuseReportReason>('PHISHING');
  const [details, setDetails] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await submitAbuseReport({
        slug,
        reason,
        details: details.trim() || undefined,
        reporterEmail: reporterEmail.trim() || undefined,
      });

      setSuccessMsg(
        res.message ||
          'Báo cáo liên kết vi phạm của bạn đã được ghi nhận. Quản trị viên sẽ xử lý sớm nhất.',
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Không thể gửi báo cáo vào lúc này. Vui lòng thử lại sau.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setDetails('');
    setReporterEmail('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 rounded-xl transition"
          aria-label="Đóng modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Báo cáo liên kết vi phạm
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Mã link: <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">/{slug}</span>
              {targetUrl && (
                <span className="ml-2 font-mono truncate max-w-[200px] inline-block align-bottom text-neutral-400">
                  ({targetUrl})
                </span>
              )}
            </p>
          </div>
        </div>

        {successMsg ? (
          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
              Cảm ơn đóng góp của bạn!
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              {successMsg}
            </p>
            <button
              type="button"
              onClick={handleResetAndClose}
              className="mt-2 px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
            >
              Hoàn tất
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs font-medium text-rose-600 dark:text-rose-400">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Lý do báo cáo vi phạm <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {REASONS.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                      reason === r.value
                        ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 text-neutral-900 dark:text-neutral-100'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="abuseReason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value)}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <div className="font-semibold">{r.label}</div>
                      <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                        {r.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Mô tả chi tiết (Tùy chọn)
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Cung cấp thêm thông tin vi phạm (ví dụ: yêu cầu nạp tiền, mạo danh trang nào)..."
                maxLength={1000}
                className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Email của bạn (Tùy chọn, để nhận phản hồi)
              </label>
              <input
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="your-email@example.com"
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <span>Gửi báo cáo</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
