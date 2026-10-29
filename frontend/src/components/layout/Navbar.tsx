'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isAuthenticated, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Đóng dropdown khi click chuột ra ngoài
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Ẩn thanh Navbar ở các trang auth (login, register...) vì các trang đó có layout riêng
    const isAuthPage =
        pathname?.startsWith('/login') ||
        pathname?.startsWith('/register') ||
        pathname?.startsWith('/verify-email') ||
        pathname?.startsWith('/forgot-password') ||
        pathname?.startsWith('/reset-password') ||
        pathname?.startsWith('/google-callback');

    if (isAuthPage) {
        return null;
    }

    const handleLogout = () => {
        logout();
        setDropdownOpen(false);
        router.push('/login');
    };

    const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Người dùng');

    const displayEmail = user?.email || '';
    const initial = displayName.charAt(0).toUpperCase();

    return (
        <header className="sticky top-0 z-40 w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md">
            {/* w-full px-6 sm:px-12 giúp 2 icon Logo (trái) và Hồ sơ (phải) cách xa nhau tối đa ở 2 đầu màn hình */}
            <div className="w-full px-6 sm:px-12 h-16 flex items-center justify-between">
                {/* Bên trái: Logo ToolHub (bấm về trang chủ) */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
                        T
                    </div>
                    <span className="font-bold text-xl tracking-tight text-neutral-900 dark:text-neutral-50">
                        Tool<span className="text-blue-600 dark:text-blue-400">Hub</span>
                    </span>
                </Link>

                {/* Bên phải: Nút Đăng nhập HOẶC Khung hồ sơ sổ xuống khi bấm */}
                <div className="flex items-center">
                    {isAuthenticated && user ? (
                        <div className="relative" ref={dropdownRef}>
                            {/* Nút bấm hiển thị tài khoản đang đăng nhập */}
                            <button
                                type="button"
                                onClick={() => setDropdownOpen((prev) => !prev)}
                                className="flex items-center gap-3 p-1.5 pl-3 pr-2.5 rounded-full border border-neutral-200 dark:border-neutral-800 hover:border-blue-500/50 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all cursor-pointer focus:outline-none"
                            >
                                <div className="flex flex-col text-right">
                                    <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 max-w-[150px] truncate">
                                        {displayName}
                                    </span>
                                    <span className="text-[10px] text-neutral-400 truncate max-w-[150px]">
                                        {displayEmail}
                                    </span>
                                </div>

                                {/* Avatar tròn */}
                                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center overflow-hidden border-2 border-white dark:border-neutral-800 shadow-sm flex-shrink-0">
                                    {user.avatarUrl ? (
                                        <div
                                            className="w-full h-full bg-cover bg-center"
                                            style={{ backgroundImage: `url(${user.avatarUrl})` }}
                                        />
                                    ) : (
                                        <span>{initial}</span>
                                    )}
                                </div>

                                {/* Mũi tên chỉ thị */}
                                <svg
                                    className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''
                                        }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Menu sổ xuống khi ấn vào */}
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2.5 w-64 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                    {/* Thông tin tài khoản */}
                                    <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                                        <p className="text-xs font-medium text-neutral-400">Đang đăng nhập với:</p>
                                        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate mt-0.5">
                                            {displayName}
                                        </p>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                            {displayEmail}
                                        </p>
                                    </div>

                                    <div className="py-1.5">
                                        <Link
                                            href="/account"
                                            onClick={() => setDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                        >
                                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Xem và sửa hồ sơ
                                        </Link>

                                        <Link
                                            href="/links"
                                            onClick={() => setDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                        >
                                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                            Quản lý liên kết rút gọn
                                        </Link>
                                    </div>

                                    {/* Đăng xuất */}
                                    <div className="border-t border-neutral-100 dark:border-neutral-800 pt-1.5">
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                        >
                                            <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
                        >
                            Đăng nhập
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
