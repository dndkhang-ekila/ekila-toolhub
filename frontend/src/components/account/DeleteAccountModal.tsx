'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface DeleteAccountModalProps {
    isOpen: boolean;
    isLoading: boolean;
    onConfirm: (password: string) => Promise<void>;
    onCancel: () => void;
}

export function DeleteAccountModal({
    isOpen,
    isLoading,
    onConfirm,
    onCancel,
}: DeleteAccountModalProps) {
    const { t } = useLanguage();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) {
            setError(t('account.deletePasswordRequired') || 'Vui lòng nhập mật khẩu xác nhận');
            return;
        }
        setError('');
        await onConfirm(password);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
        >
            <div
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Icon + Title */}
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-900/50">
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h3
                                id="delete-modal-title"
                                className="text-xl font-bold text-neutral-900 dark:text-white"
                            >
                                {t('account.deleteModalTitle') || 'Xác nhận xoá tài khoản vĩnh viễn?'}
                            </h3>
                        </div>
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                            ⏱️ Thời hạn ân hạn 30 ngày
                        </span>
                    </div>
                </div>

                {/* Warning details callout */}
                <div className="mt-5 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 text-sm text-neutral-600 dark:text-neutral-300 space-y-2">
                    <p className="font-semibold text-neutral-900 dark:text-white">
                        {t('account.deleteWarningNotice') ||
                            'Hệ thống sẽ chuyển tài khoản sang trạng thái chờ huỷ trong vòng 30 ngày theo Nghị định 13/2023/NĐ-CP.'}
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                        <li>Mọi phiên đăng nhập trên tất cả thiết bị sẽ bị đăng xuất ngay lập tức.</li>
                        <li>Bạn có thể đăng nhập lại bất cứ lúc nào trong 30 ngày để huỷ yêu cầu xoá.</li>
                        <li>Sau 30 ngày, toàn bộ dữ liệu (QR code, liên kết rút gọn, lịch sử) sẽ bị thanh trừng vĩnh viễn không thể khôi phục.</li>
                    </ul>
                </div>

                {/* Password confirmation form */}
                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <div>
                        <label
                            htmlFor="delete-password-input"
                            className="block text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1.5"
                        >
                            {t('account.deletePasswordLabel') || 'Nhập mật khẩu hiện tại để xác nhận:'}
                        </label>
                        <div className="relative">
                            <input
                                id="delete-password-input"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (error) setError('');
                                }}
                                disabled={isLoading}
                                placeholder={t('account.deletePasswordPlaceholder') || 'Nhập mật khẩu của bạn'}
                                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm disabled:opacity-50 pr-12"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                            >
                                {showPassword ? 'Ẩn' : 'Hiện'}
                            </button>
                        </div>
                        {error && (
                            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 justify-end pt-3 border-t border-neutral-100 dark:border-neutral-800">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="px-5 py-2.5 rounded-xl font-medium text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition disabled:opacity-50"
                        >
                            {t('account.deleteCancelButton') || 'Huỷ bỏ'}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Đang xử lý...</span>
                                </>
                            ) : (
                                <span>{t('account.deleteConfirmButton') || 'Xoá tài khoản (ân hạn 30 ngày)'}</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
