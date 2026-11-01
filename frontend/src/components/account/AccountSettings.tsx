'use client';

import { useEffect, useState } from 'react';
import {
    changePassword,
    deleteAccount,
    fetchProfile,
    logoutAllDevices,
    restoreAccount,
    updateProfile,
} from '@/lib/account-api';
import { UserProfile } from '@/types/account';
import { ConfirmModal } from './ConfirmModal';
import { DeleteAccountModal } from './DeleteAccountModal';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Theme } from '@/types/theme';
import { Locale } from '@/types/language';

export function AccountSettings() {
    const { theme, setTheme } = useTheme();
    const { locale, setLocale, t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'sessions' | 'preferences' | 'delete'>('profile');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordSaving, setPasswordSaving] = useState(false);

    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [restoreLoading, setRestoreLoading] = useState(false);

    const [toast, setToast] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => {
            setToast(null);
        }, 4000);
    };

    useEffect(() => {
        let isMounted = true;
        fetchProfile()
            .then((data) => {
                if (!isMounted) return;
                setProfile(data);
                setName(data.name || '');
                setPhone(data.phone || '');
                setAvatarUrl(data.avatarUrl || '');
                setLoading(false);
            })
            .catch((err: unknown) => {
                if (!isMounted) return;
                const msg = err instanceof Error ? err.message : 'Không thể tải thông tin tài khoản';
                setToast({ type: 'error', message: msg });
                setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setProfileSaving(true);
            const updated = await updateProfile({
                name,
                phone,
                avatarUrl,
            });
            setProfile(updated);
            showToast('success', 'Cập nhật hồ sơ thành công!');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật hồ sơ';
            showToast('error', msg);
        } finally {
            setProfileSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 8) {
            showToast('error', 'Mật khẩu mới phải có ít nhất 8 ký tự');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('error', 'Xác nhận mật khẩu mới không khớp');
            return;
        }

        try {
            setPasswordSaving(true);
            const res = await changePassword({
                currentPassword,
                newPassword,
            });
            showToast('success', res.message || 'Đổi mật khẩu thành công!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Lỗi khi đổi mật khẩu';
            showToast('error', msg);
        } finally {
            setPasswordSaving(false);
        }
    };

    const handleLogoutAll = async () => {
        try {
            setLogoutLoading(true);
            const res = await logoutAllDevices();
            setIsLogoutModalOpen(false);
            showToast('success', res.message || 'Đã đăng xuất khỏi mọi thiết bị thành công!');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Lỗi khi đăng xuất các thiết bị';
            showToast('error', msg);
        } finally {
            setLogoutLoading(false);
        }
    };

    const handleDeleteAccount = async (password: string) => {
        try {
            setDeleteLoading(true);
            const res = await deleteAccount({ password });
            setProfile((prev) =>
                prev
                    ? {
                          ...prev,
                          isDeleted: true,
                          scheduledPermanentDeletionAt: res.scheduledPermanentDeletionAt,
                      }
                    : null,
            );
            setIsDeleteModalOpen(false);
            showToast('success', res.message || (t('account.deleteSuccessToast') as string));
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Lỗi khi yêu cầu xoá tài khoản';
            showToast('error', msg);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleRestoreAccount = async () => {
        try {
            setRestoreLoading(true);
            const res = await restoreAccount();
            setProfile((prev) =>
                prev
                    ? {
                          ...prev,
                          isDeleted: false,
                          scheduledPermanentDeletionAt: null,
                          deletedAt: null,
                      }
                    : null,
            );
            showToast('success', res.message || (t('account.restoreSuccessToast') as string));
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Lỗi khi khôi phục tài khoản';
            showToast('error', msg);
        } finally {
            setRestoreLoading(false);
        }
    };

    const getPasswordStrength = () => {
        if (!newPassword) return { text: '', color: '', percent: 0 };
        if (newPassword.length < 8) return { text: 'Quá ngắn', color: 'bg-red-500', percent: 25 };
        const hasNumber = /\d/.test(newPassword);
        const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
        const hasUpper = /[A-Z]/.test(newPassword);

        const score = [hasNumber, hasSpecial, hasUpper].filter(Boolean).length;
        if (score === 3) return { text: 'Rất mạnh', color: 'bg-emerald-500', percent: 100 };
        if (score >= 1) return { text: 'Trung bình', color: 'bg-amber-500', percent: 65 };
        return { text: 'Yếu', color: 'bg-rose-500', percent: 40 };
    };

    const strength = getPasswordStrength();

    if (loading) {
        return (
            <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-neutral-500">
                <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium">Đang tải thông tin tài khoản...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl border flex items-center gap-3 transition-all animate-in fade-in slide-in-from-bottom-4 ${toast.type === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                            : 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                        }`}
                >
                    <span className="font-medium text-sm">{toast.message}</span>
                </div>
            )}

            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                    {t('account.title')}
                </h1>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    {t('account.subtitle')}
                </p>
            </div>

            <div className="flex border-b border-neutral-200 dark:border-neutral-800 mb-8 gap-2 overflow-x-auto pb-px">
                <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className={`pb-3 px-4 font-semibold text-sm border-b-2 transition shrink-0 ${activeTab === 'profile'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                        }`}
                >
                    {t('account.profileTab')}
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('password')}
                    className={`pb-3 px-4 font-semibold text-sm border-b-2 transition shrink-0 ${activeTab === 'password'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                        }`}
                >
                    {t('account.passwordTab')}
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('sessions')}
                    className={`pb-3 px-4 font-semibold text-sm border-b-2 transition shrink-0 ${activeTab === 'sessions'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                        }`}
                >
                    {t('account.sessionsTab')}
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('preferences')}
                    className={`pb-3 px-4 font-semibold text-sm border-b-2 transition shrink-0 ${activeTab === 'preferences'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                        }`}
                >
                    {t('account.preferencesTab')}
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('delete')}
                    className={`pb-3 px-4 font-semibold text-sm border-b-2 transition shrink-0 flex items-center gap-1.5 ${activeTab === 'delete'
                            ? 'border-red-600 text-red-600 dark:text-red-400'
                            : 'border-transparent text-neutral-500 hover:text-red-600 dark:hover:text-red-400'
                        }`}
                >
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    {t('account.deleteTab') || 'Xoá tài khoản'}
                </button>
            </div>

            {activeTab === 'profile' && (
                <form onSubmit={handleUpdateProfile} className="space-y-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center gap-6 pb-6 border-b border-neutral-100 dark:border-neutral-800">
                        <div className="w-20 h-20 rounded-full bg-indigo-600 text-white font-bold text-2xl flex items-center justify-center border-2 border-indigo-100 dark:border-neutral-700 shadow overflow-hidden">
                            {avatarUrl ? (
                                <div
                                    className="w-full h-full bg-cover bg-center"
                                    style={{ backgroundImage: `url(${avatarUrl})` }}
                                />
                            ) : (
                                (name || 'U').charAt(0).toUpperCase()
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-neutral-900 dark:text-white">
                                {name || 'Người dùng'}
                            </h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                {profile?.email}
                            </p>
                            <span className="inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400">
                                Đã xác thực
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-2">
                                Họ và tên
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={profile?.email || ''}
                                disabled
                                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/50 text-neutral-500 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-2">
                                Số điện thoại
                            </label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="0901234567"
                                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-2">
                                URL Ảnh đại diện
                            </label>
                            <input
                                type="url"
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                                placeholder="https://example.com/avatar.jpg"
                                className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={profileSaving}
                            className="px-6 py-2.5 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50 flex items-center gap-2"
                        >
                            {profileSaving && (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            )}
                            Lưu thay đổi
                        </button>
                    </div>
                </form>
            )}

            {activeTab === 'password' && (
                <form onSubmit={handleChangePassword} className="space-y-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-2">
                            Mật khẩu hiện tại
                        </label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            placeholder="Nhập mật khẩu hiện tại"
                            className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-2">
                            Mật khẩu mới
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            placeholder="Tối thiểu 8 ký tự"
                            className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {newPassword && (
                            <div className="mt-2.5">
                                <div className="flex justify-between text-xs text-neutral-500 mb-1">
                                    <span>Độ mạnh: {strength.text}</span>
                                    <span>{strength.percent}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-300 ${strength.color}`}
                                        style={{ width: `${strength.percent}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-2">
                            Xác nhận mật khẩu mới
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Nhập lại mật khẩu mới"
                            className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={passwordSaving}
                            className="px-6 py-2.5 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50 flex items-center gap-2"
                        >
                            {passwordSaving && (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            )}
                            Cập nhật mật khẩu
                        </button>
                    </div>
                </form>
            )}

            {activeTab === 'sessions' && (
                <div className="space-y-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm">
                    <div>
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                            Phiên đăng nhập & Thiết bị
                        </h3>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Quản lý các thiết bị đang có quyền truy cập vào tài khoản ToolHub của bạn.
                        </p>
                    </div>

                    <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                                ✓
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-neutral-900 dark:text-white">
                                    Thiết bị hiện tại (Trình duyệt này)
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Đang hoạt động • Windows / Google Chrome
                                </p>
                            </div>
                        </div>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                            Hiện tại
                        </span>
                    </div>

                    <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                        <h4 className="font-semibold text-neutral-900 dark:text-white text-sm">
                            Đăng xuất khỏi mọi thiết bị khác
                        </h4>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Nếu bạn nghi ngờ tài khoản bị lộ hoặc quên đăng xuất trên máy tính công cộng, tính năng này sẽ lập tức hủy bỏ quyền truy cập của mọi thiết bị và ứng dụng khác.
                        </p>

                        <button
                            type="button"
                            onClick={() => setIsLogoutModalOpen(true)}
                            className="mt-4 px-5 py-2.5 rounded-xl font-medium bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                        >
                            Đăng xuất khỏi mọi thiết bị
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'preferences' && (
                <div className="space-y-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-sm">
                    <div>
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                            {t('account.preferencesTitle')}
                        </h3>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            {t('account.preferencesDesc')}
                        </p>
                    </div>

                    {/* Section 1: Chế độ giao diện (Theme) */}
                    <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
                        <div>
                            <h4 className="font-semibold text-sm text-neutral-900 dark:text-white">
                                {t('account.themeSectionTitle')}
                            </h4>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                {t('account.themeSectionHint')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                            {[
                                {
                                    id: 'light' as Theme,
                                    title: t('theme.light'),
                                    desc: t('theme.lightDesc'),
                                    icon: (
                                        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    ),
                                },
                                {
                                    id: 'dark' as Theme,
                                    title: t('theme.dark'),
                                    desc: t('theme.darkDesc'),
                                    icon: (
                                        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                        </svg>
                                    ),
                                },
                                {
                                    id: 'system' as Theme,
                                    title: t('theme.system'),
                                    desc: t('theme.systemDesc'),
                                    icon: (
                                        <svg className="w-5 h-5 text-neutral-500 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    ),
                                },
                            ].map((item) => {
                                const isSelected = theme === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            setTheme(item.id);
                                            showToast('success', t('account.savedPreferencesToast'));
                                        }}
                                        className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                                            isSelected
                                                ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 dark:border-indigo-500 shadow-sm ring-2 ring-indigo-600/20'
                                                : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900/50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between w-full mb-3">
                                            <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                                                {item.icon}
                                            </div>
                                            {isSelected && (
                                                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                                                    ✓
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <h5 className="font-semibold text-sm text-neutral-900 dark:text-white">
                                                {item.title}
                                            </h5>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 2: Ngôn ngữ (Language) */}
                    <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
                        <div>
                            <h4 className="font-semibold text-sm text-neutral-900 dark:text-white">
                                {t('account.languageSectionTitle')}
                            </h4>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                {t('account.languageSectionHint')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {[
                                {
                                    code: 'vi' as Locale,
                                    label: 'Tiếng Việt',
                                    nativeName: 'Tiếng Việt (Việt Nam)',
                                    flag: '🇻🇳',
                                    desc: t('language.viDesc'),
                                },
                                {
                                    code: 'en' as Locale,
                                    label: 'English',
                                    nativeName: 'English (United States)',
                                    flag: '🇬🇧',
                                    desc: t('language.enDesc'),
                                },
                            ].map((item) => {
                                const isSelected = locale === item.code;
                                return (
                                    <button
                                        key={item.code}
                                        type="button"
                                        onClick={() => {
                                            setLocale(item.code);
                                            showToast('success', t('account.savedPreferencesToast'));
                                        }}
                                        className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                                            isSelected
                                                ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 dark:border-indigo-500 shadow-sm ring-2 ring-indigo-600/20'
                                                : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <span className="text-3xl leading-none" role="img" aria-label={item.label}>
                                                {item.flag}
                                            </span>
                                            <div>
                                                <h5 className="font-semibold text-sm text-neutral-900 dark:text-white">
                                                    {item.nativeName}
                                                </h5>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                    {item.desc}
                                                </p>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                                ✓
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'delete' && (
                <div className="space-y-6">
                    {profile?.isDeleted ? (
                        <div className="p-6 sm:p-8 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800 shadow-sm space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 text-2xl font-bold">
                                    ⚠️
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-bold text-amber-900 dark:text-amber-100">
                                        Tài khoản đang trong trạng thái chờ huỷ vĩnh viễn
                                    </h4>
                                    <p className="mt-1 text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                                        Yêu cầu xoá tài khoản của bạn đã được ghi nhận và đang trong thời hạn ân hạn 30 ngày. 
                                        Thời điểm xoá vĩnh viễn dự kiến: <strong className="font-semibold underline">
                                            {profile.scheduledPermanentDeletionAt
                                                ? new Date(profile.scheduledPermanentDeletionAt).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
                                                      year: 'numeric',
                                                      month: 'long',
                                                      day: 'numeric',
                                                      hour: '2-digit',
                                                      minute: '2-digit',
                                                  })
                                                : '30 ngày kể từ ngày yêu cầu'}
                                        </strong>.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-amber-200 dark:border-amber-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <p className="text-xs text-amber-700 dark:text-amber-300">
                                    Đổi ý? Bạn có thể kích hoạt lại tài khoản ngay bây giờ mà không mất bất kỳ dữ liệu nào.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleRestoreAccount}
                                    disabled={restoreLoading}
                                    className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm flex items-center gap-2 shrink-0 disabled:opacity-50"
                                >
                                    {restoreLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Đang khôi phục...</span>
                                        </>
                                    ) : (
                                        <span>{t('account.restoreAccountBtn') || 'Huỷ yêu cầu & Khôi phục tài khoản'}</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-900/60 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 mb-3">
                                    <span>⚠️</span> {t('account.dangerZoneTitle') || 'Vùng nguy hiểm'}
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                                    {t('account.deleteTitle') || 'Xoá tài khoản vĩnh viễn'}
                                </h3>
                                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                    {t('account.deleteSubtitle') || 'Yêu cầu huỷ tài khoản và toàn bộ dữ liệu cá nhân liên quan trong vòng 30 ngày.'}
                                </p>
                            </div>

                            <div className="p-5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 space-y-3">
                                <h4 className="font-semibold text-sm text-red-900 dark:text-red-200 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                    {t('account.deleteWarningHeader') || 'Lưu ý cực kỳ quan trọng trước khi xoá tài khoản:'}
                                </h4>
                                <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                                    <li>
                                        <strong>Thời hạn ân hạn 30 ngày:</strong> Tài khoản của bạn không bị xoá ngay lập tức mà sẽ chuyển sang trạng thái chờ huỷ trong 30 ngày (tuân thủ Nghị định 13/2023/NĐ-CP).
                                    </li>
                                    <li>
                                        <strong>Vô hiệu hoá phiên đăng nhập:</strong> Mọi phiên đăng nhập hiện tại trên điện thoại, máy tính bảng và trình duyệt sẽ lập tức bị ngắt kết nối.
                                    </li>
                                    <li>
                                        <strong>Xoá sạch dữ liệu:</strong> Sau khi hết 30 ngày, toàn bộ dữ liệu (liên kết rút gọn, mã QR, lịch sử tiện ích, thông tin cá nhân) sẽ bị xoá vĩnh viễn khỏi hệ thống và không thể phục hồi dưới bất kỳ hình thức nào.
                                    </li>
                                    <li>
                                        <strong>Quyền khôi phục:</strong> Bạn có thể quay lại đăng nhập và huỷ bỏ yêu cầu xoá bất kỳ lúc nào trước khi thời hạn 30 ngày kết thúc.
                                    </li>
                                </ul>
                            </div>

                            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <h5 className="font-semibold text-sm text-neutral-900 dark:text-white">
                                        Bạn đã sẵn sàng xoá tài khoản?
                                    </h5>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                        Hành động này cần xác nhận lại bằng mật khẩu hiện tại của bạn.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-red-600 hover:bg-red-700 transition shadow-sm shrink-0"
                                >
                                    {t('account.deleteConfirmButton') || 'Xoá tài khoản (ân hạn 30 ngày)'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <ConfirmModal
                isOpen={isLogoutModalOpen}
                title="Đăng xuất khỏi mọi thiết bị?"
                description="Bạn có chắc chắn muốn hủy tất cả các phiên đăng nhập khác? Các thiết bị đó sẽ cần phải nhập lại mật khẩu để đăng nhập."
                confirmText="Đăng xuất tất cả"
                cancelText="Đóng"
                isLoading={logoutLoading}
                onConfirm={handleLogoutAll}
                onCancel={() => setIsLogoutModalOpen(false)}
            />

            <DeleteAccountModal
                isOpen={isDeleteModalOpen}
                isLoading={deleteLoading}
                onConfirm={handleDeleteAccount}
                onCancel={() => setIsDeleteModalOpen(false)}
            />
        </div>
    );
}
