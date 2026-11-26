'use client';

import React, { useState } from 'react';
import { LockIcon, SearchIcon } from '@/components/ui/Icons';
import { LinkSearchUnlock, SetLinkPasswordCard } from '@/components/protected-link';

export default function ProtectedLinkPage() {
  const [activeTab, setActiveTab] = useState<'unlock' | 'set-password'>('unlock');
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const [draftSlugForSet, setDraftSlugForSet] = useState<string>('');

  const handleSelectSlugToUnlock = (slug: string) => {
    setSelectedSlug(slug);
    setActiveTab('unlock');
  };

  const handleRequestSetPassword = (slug: string) => {
    setDraftSlugForSet(slug);
    setActiveTab('set-password');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-100/80 dark:bg-neutral-950 py-8 sm:py-10 px-4 sm:px-6 transition-colors duration-200">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Compact Segmented Mode Switcher */}
        <div className="flex justify-center">
          <div className="inline-flex items-center p-1 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setSelectedSlug('');
                setActiveTab('unlock');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === 'unlock'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <SearchIcon className="w-4 h-4" />
              <span>Tìm kiếm &amp; Mở khóa</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftSlugForSet('');
                setActiveTab('set-password');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === 'set-password'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <LockIcon className="w-4 h-4" />
              <span>Đặt mật khẩu</span>
            </button>
          </div>
        </div>

        {/* Workspace Content */}
        {activeTab === 'unlock' ? (
          <LinkSearchUnlock
            key={`unlock-${selectedSlug}`}
            initialSlug={selectedSlug}
            onRequestSetPassword={handleRequestSetPassword}
          />
        ) : (
          <SetLinkPasswordCard
            key={`set-${draftSlugForSet}`}
            initialSlug={draftSlugForSet}
            onSelectSlugToUnlock={handleSelectSlugToUnlock}
          />
        )}
      </div>
    </div>
  );
}
