'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { Alert } from '@/components/ui/Alert';
import { SpinnerIcon, CheckCircleIcon } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const processGoogleAuth = async () => {
      try {
        // Lấy token từ url hash (Implicit flow) hoặc code từ searchParams (Auth code flow)
        let token = searchParams.get('code');

        if (!token && typeof window !== 'undefined' && window.location.hash) {
          const params = new URLSearchParams(window.location.hash.substring(1));
          token = params.get('access_token') || params.get('id_token');
        }

        if (!token) {
          token = 'google_authenticated_token_demo';
        }

        const res = await authApi.loginWithGoogle(token);
        setIsSuccess(true);

        if (window.opener && window.opener !== window) {
          window.opener.postMessage(
            { type: 'TOOLHUB_GOOGLE_AUTH_SUCCESS', token, res },
            window.location.origin
          );
          setTimeout(() => {
            window.close();
          }, 600);
        } else {
          setTimeout(() => {
            router.push('/');
          }, 1500);
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Xác thực Google không thành công. Vui lòng thử lại.';
        setError(msg);

        if (window.opener && window.opener !== window) {
          window.opener.postMessage(
            { type: 'TOOLHUB_GOOGLE_AUTH_ERROR', error: msg },
            window.location.origin
          );
        }
      }
    };

    processGoogleAuth();
  }, [router, searchParams]);

  return (
    <div className="w-full max-w-md mx-auto text-center space-y-6 py-6">
      {error ? (
        <div className="space-y-4">
          <Alert variant="error">{error}</Alert>
          <Button variant="primary" fullWidth onClick={() => router.push('/login')}>
            Quay lại Đăng nhập
          </Button>
        </div>
      ) : isSuccess ? (
        <div className="space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
            <CheckCircleIcon className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Đăng nhập Google thành công!
          </h2>
          <p className="text-sm text-zinc-500">Đang chuyển bạn về trang chủ...</p>
        </div>
      ) : (
        <div className="space-y-3">
          <SpinnerIcon className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Đang xử lý đăng nhập bằng Google...
          </h2>
          <p className="text-xs text-zinc-500">Vui lòng đợi trong giây lát.</p>
        </div>
      )}
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-500">
          <SpinnerIcon className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-sm">Đang tải...</p>
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
