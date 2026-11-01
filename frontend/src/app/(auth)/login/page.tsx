'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { SpinnerIcon } from '@/components/ui/Icons';

function LoginContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  return <LoginForm redirectUrl={redirect} />;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-500">
          <SpinnerIcon className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-sm">Đang tải giao diện...</p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
