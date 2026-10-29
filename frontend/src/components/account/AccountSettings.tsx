'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    changePassword,
    fetchProfile,
    logoutAllDevices,
    updateProfile,
} from '@/lib/account-api';
import { tokenStorage } from '@/lib/api';
import { UserProfile } from '@/types/account';
import { useAuth } from '@/context/AuthContext';
import { ConfirmModal } from './ConfirmModal';

export function AccountSettings() {
    const router = useRouter();
    const { user: authUser, setUser: setAuthUser, logout } = useAuth();

    const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'sessions'>('profile');
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
                setName(data.name || authUser?.name || '');
                setPhone(data.phone || '');
                setAvatarUrl(data.avatarUrl || authUser?.avatarUrl || '');
                setLoading(false);
            })
            .catch((err: unknown) => {
                if (!isMounted) return;
                if (authUser) {
                    setProfile({
                        id: authUser.id,
                        email: authUser.email,
                        name: authUser.name,
                        avatarUrl: authUser.avatarUrl,
                        role: authUser.role,
                        plan: authUser.plan,
                        locale: authUser.locale,
                        isEmailVerified: authUser.isEmailVerified,
                        createdAt: authUser.createdAt,
                    });
                    setName(authUser.name || '');
                    setAvatarUrl(authUser.avatarUrl || '');
                }
                const msg = err instanceof Error ? err.message : 'Không thể tải thông tin tài khoản';
                showToast('error', msg);
                setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [authUser]);

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

            if (authUser) {
                const nextUser = {
                    ...authUser,
                    name: updated.name,
                    avatarUrl: updated.avatarUrl,
                };
                setAuthUser(nextUser);
                tokenStorage.setUser(nextUser);
            }

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
            logout();
            showToast('success', res.message || 'Đã đăng xuất khỏi mọi thiết bị thành công!');
            setTimeout(() => {
                router.push('/login');
            }, 1500);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Lỗi khi đăng xuất các thiết bị';
            showToast('error', msg);
        } finally {
            setLogoutLoading(false);
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
                    Cài đặt tài khoản
                </h1>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    Quản lý thông tin hồ sơ, mật khẩu và phiên đăng nhập bảo mật
                </p>
            </div>

            <div className="flex border-b border-neutral-200 dark:border-neutral-800 mb-8 gap-2">
                <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className={`pb-3 px-4 font-semibold text-sm border-b-2 transition ${activeTab === 'profile'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                        }`}
                >
                    Hồ sơ cá nhân
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('password')}
                    className={`pb-3 px-4 font-semibold text-sm border-b-2 transition ${activeTab === 'password'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                        }`}
                >
                    Đổi mật khẩu
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('sessions')}
                    className={`pb-3 px-4 font-semibold text-sm border-b-2 transition ${activeTab === 'sessions'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                        }`}
                >
                    Thiết bị & Bảo mật
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
                                (name || profile?.name || 'U').charAt(0).toUpperCase()
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-neutral-900 dark:text-white">
                                {name || profile?.name || 'Người dùng'}
                            </h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                {profile?.email || authUser?.email}
                            </p>
                            <div className="flex gap-2 mt-2">
                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400">
                                    {profile?.isEmailVerified ? 'Email đã xác thực' : 'Đã xác thực'}
                                </span>
                                {profile?.role && (
                                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 uppercase">
                                        {profile.role}
                                    </span>
                                )}
                            </div>
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
                                value={profile?.email || authUser?.email || ''}
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
        </div>
    );
}
