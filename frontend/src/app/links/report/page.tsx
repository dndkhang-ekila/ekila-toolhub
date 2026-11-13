'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AbuseReportReason,
  submitAbuseReport,
} from '@/lib/report-api';

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

function ReportFormContent() {
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get('slug') || '';

  const [slug, setSlug] = useState(initialSlug);
  const [reason, setReason] = useState<AbuseReportReason>('PHISHING');
  const [details, setDetails] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim()) {
      setErrorMsg('Vui lòng nhập mã slug của liên kết vi phạm.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await submitAbuseReport({
        slug: slug.trim().replace(/^\//, ''),
        reason,
        details: details.trim() || undefined,
        reporterEmail: reporterEmail.trim() || undefined,
      });

      setSuccessMsg(
        res.message ||
          'Báo cáo liên kết vi phạm đã được ghi nhận. Quản trị viên sẽ xử lý sớm nhất.',
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

  return (
    <div className="max-w-xl w-full mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-6">
      <div className="flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-5">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
            Báo cáo liên kết vi phạm
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Giúp cộng đồng an toàn bằng cách báo cáo các liên kết giả mạo, độc hại hoặc spam
          </p>
        </div>
      </div>

      {successMsg ? (
        <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
            Tiếp nhận báo cáo thành công
          </h2>
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {successMsg}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/"
              className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
            >
              Về trang chủ
            </Link>
            <button
              type="button"
              onClick={() => {
                setSuccessMsg(null);
                setDetails('');
              }}
              className="px-5 py-2.5 text-xs font-semibold rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              Gửi báo cáo khác
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs font-medium text-rose-600 dark:text-rose-400">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              Mã link hoặc Slug cần báo cáo <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-neutral-400">
                /
              </span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.replace(/^\//, ''))}
                placeholder="slug-can-bao-cao"
                className="w-full text-xs font-mono pl-7 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              Lý do vi phạm <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2">
              {REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-start gap-3 p-3 rounded-2xl border text-xs cursor-pointer transition ${
                    reason === r.value
                      ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 text-neutral-900 dark:text-neutral-100 shadow-sm'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="pageReason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {r.label}
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {r.desc}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              Mô tả chi tiết bằng chứng vi phạm
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Cung cấp ngữ cảnh, đường link dẫn tới trang đích mạo danh hoặc hành vi lừa đảo..."
              maxLength={1000}
              className="w-full text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              Email của bạn (Tùy chọn)
            </label>
            <input
              type="email"
              value={reporterEmail}
              onChange={(e) => setReporterEmail(e.target.value)}
              placeholder="reporter@example.com"
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
            />
          </div>

          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <Link
              href="/"
              className="px-4 py-2.5 text-xs font-semibold rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              Quay lại
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <span>Gửi báo cáo vi phạm</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ReportPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-10 bg-neutral-50 dark:bg-neutral-950">
      <Suspense
        fallback={
          <div className="text-center text-sm text-neutral-400 py-12">
            Đang tải biểu mẫu...
          </div>
        }
      >
        <ReportFormContent />
      </Suspense>
    </main>
  );
}
