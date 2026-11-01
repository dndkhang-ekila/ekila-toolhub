'use client';

import React, { Suspense } from 'react';
import { VerifyEmailCard } from '@/components/auth/VerifyEmailCard';
import { SpinnerIcon } from '@/components/ui/Icons';

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-500">
          <SpinnerIcon className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-sm">Đang tải thông tin xác minh...</p>
        </div>
      }
    >
      <VerifyEmailCard />
    </Suspense>
  );
}
