import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6 sm:my-10">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xl shadow-neutral-200/50 dark:shadow-black/40 p-6 sm:p-8 backdrop-blur-sm transition-colors">
        {children}
      </div>
    </div>
  );
}
