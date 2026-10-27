'use client';

import React, { useState, useEffect } from 'react';
import { GoogleIcon, SpinnerIcon, AlertCircleIcon } from '../ui/Icons';
import { authApi } from '@/lib/api';
import { AuthResponse } from '@/types/auth';
import { Button } from '../ui/Button';

interface GoogleSignInButtonProps {
  onSuccess?: (res: AuthResponse) => void;
  onError?: (error: string) => void;
  mode?: 'login' | 'register';
  disabled?: boolean;
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  mode = 'login',
  disabled = false,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Lắng nghe postMessage từ popup callback
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'TOOLHUB_GOOGLE_AUTH_SUCCESS') {
        setLoading(false);
        if (event.data.res) {
          onSuccess?.(event.data.res);
        }
      } else if (event.data?.type === 'TOOLHUB_GOOGLE_AUTH_ERROR') {
        setLoading(false);
        onError?.(event.data.error || 'Đăng nhập Google thất bại');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess, onError]);

  // Hàm mở cửa sổ Popup căn giữa màn hình (chuẩn Google OAuth popup)
  const openCenteredPopup = (url: string) => {
    const width = 500;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    return window.open(
      url,
      'google_signin_popup',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
    );
  };

  const startGoogleOAuth = (clientId: string) => {
    const redirectUri = `${window.location.origin}/google-callback`;
    const scope = encodeURIComponent('openid email profile');
    // prompt=select_account buộc Google hiển thị màn hình 'Chọn tài khoản' (Account Chooser)
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token&scope=${scope}&prompt=select_account`;

    openCenteredPopup(oauthUrl);
  };

  const handleGoogleAuth = async () => {
    if (disabled || loading) return;

    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    // 1. Nếu đã có Client ID, mở ngay Popup chọn tài khoản Google thật
    if (googleClientId && typeof window !== 'undefined') {
      setLoading(true);
      startGoogleOAuth(googleClientId);
      return;
    }

    // 2. Nếu chưa có Client ID trong .env.local, mở Modal hướng dẫn và cho phép lựa chọn
    setShowConfigModal(true);
  };

  const handleSimulatedLogin = async () => {
    setShowConfigModal(false);
    setLoading(true);
    try {
      const res = await authApi.loginWithGoogle('demo_google_credential_token');
      onSuccess?.(res);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Không thể đăng nhập bằng Google vào lúc này.';
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGoogleAnyway = () => {
    setShowConfigModal(false);
    // Mở popup tới Google OAuth endpoint để người dùng thấy giao diện Google
    const dummyClientId = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
    startGoogleOAuth(dummyClientId);
  };

  const label =
    mode === 'login' ? 'Đăng nhập bằng Google' : 'Tiếp tục với Google';

  return (
    <>
      <button
        type="button"
        onClick={handleGoogleAuth}
        disabled={disabled || loading}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:bg-zinc-100 font-medium text-sm transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        aria-label={label}
      >
        {loading ? (
          <SpinnerIcon className="w-5 h-5 text-zinc-500 animate-spin" />
        ) : (
          <GoogleIcon className="w-5 h-5 shrink-0" />
        )}
        <span>{loading ? 'Đang mở cửa sổ Google...' : label}</span>
      </button>

      {/* Modal hướng dẫn khi chưa có NEXT_PUBLIC_GOOGLE_CLIENT_ID */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center shrink-0">
                <AlertCircleIcon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Cần Google Client ID để mở trang thật
              </h3>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Để Google hiển thị cửa sổ <strong>&quot;Chọn tài khoản&quot; (accounts.google.com)</strong> như bạn thấy, Google bắt buộc ứng dụng phải gửi kèm <code>client_id</code> đã được đăng ký tại Google Cloud Console.
            </p>

            <div className="bg-zinc-100 dark:bg-zinc-800/80 p-3 rounded-lg text-xs space-y-1.5 font-mono text-zinc-800 dark:text-zinc-200">
              <div className="font-bold text-[11px] text-zinc-500">Cách bật cửa sổ Google thật:</div>
              <div>1. Mở file <span className="text-blue-600 dark:text-blue-400">frontend/.env.local</span></div>
              <div>2. Thêm dòng:</div>
              <div className="text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-950 p-1.5 rounded border border-zinc-200 dark:border-zinc-700 select-all">
                NEXT_PUBLIC_GOOGLE_CLIENT_ID=&lt;client_id_cua_ban&gt;
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={handleSimulatedLogin}
              >
                Đăng nhập thử (Dev Mode)
              </Button>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={handleOpenGoogleAnyway}
              >
                Mở thử cửa sổ Google
              </Button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
