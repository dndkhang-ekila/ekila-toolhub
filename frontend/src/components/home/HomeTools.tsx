'use client';

import { useState, useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Tool } from '@/types/tools';
import { ALL_TOOLS, TOOL_CATEGORIES } from '@/data/tools';

const PINNED_STORAGE_KEY = 'toolhub_pinned_tools';
const RECENT_STORAGE_KEY = 'toolhub_recent_tools';
const MAX_RECENT_ITEMS = 4;

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getPinnedSnapshot() {
  return typeof window !== 'undefined'
    ? localStorage.getItem(PINNED_STORAGE_KEY) || '[]'
    : '[]';
}

function getRecentSnapshot() {
  return typeof window !== 'undefined'
    ? localStorage.getItem(RECENT_STORAGE_KEY) || '[]'
    : '[]';
}

function getServerSnapshot() {
  return '[]';
}

export function HomeTools() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const pinnedRaw = useSyncExternalStore(
    subscribe,
    getPinnedSnapshot,
    getServerSnapshot
  );

  const recentRaw = useSyncExternalStore(
    subscribe,
    getRecentSnapshot,
    getServerSnapshot
  );

  const pinnedIds = useMemo(() => {
    try {
      return JSON.parse(pinnedRaw) as string[];
    } catch {
      return [];
    }
  }, [pinnedRaw]);

  const recentIds = useMemo(() => {
    try {
      return JSON.parse(recentRaw) as string[];
    } catch {
      return [];
    }
  }, [recentRaw]);

  // [FR-COM-06] Toggle ghim / bỏ ghim tiện ích yêu thích
  const togglePin = (e: React.MouseEvent, toolId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const nextPinned = pinnedIds.includes(toolId)
      ? pinnedIds.filter((id) => id !== toolId)
      : [...pinnedIds, toolId];

    try {
      localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(nextPinned));
      window.dispatchEvent(new Event('storage'));
    } catch {
      // Ignore storage errors
    }
  };

  // [FR-COM-01] Lưu tiện ích vừa click vào danh sách "Dùng gần đây"
  const handleToolClick = (toolId: string) => {
    const nextRecent = [toolId, ...recentIds.filter((id) => id !== toolId)].slice(
      0,
      MAX_RECENT_ITEMS
    );

    try {
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(nextRecent));
      window.dispatchEvent(new Event('storage'));
    } catch {
      // Ignore storage errors
    }
  };

  // Xoá danh sách dùng gần đây
  const clearRecent = () => {
    try {
      localStorage.removeItem(RECENT_STORAGE_KEY);
      window.dispatchEvent(new Event('storage'));
    } catch {
      // Ignore storage errors
    }
  };

  // Lọc tiện ích theo từ khoá tìm kiếm và danh mục
  const filteredTools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return ALL_TOOLS.filter((tool) => {
      const matchCategory =
        selectedCategory === 'all' || tool.category === selectedCategory;
      if (!matchCategory) return false;

      if (!query) return true;

      const matchName = tool.name.toLowerCase().includes(query);
      const matchDesc = tool.description.toLowerCase().includes(query);
      const matchTag = tool.tags.some((tag) => tag.toLowerCase().includes(query));

      return matchName || matchDesc || matchTag;
    });
  }, [searchQuery, selectedCategory]);

  // Danh sách các công cụ đã ghim
  const pinnedTools = useMemo(() => {
    return ALL_TOOLS.filter((tool) => pinnedIds.includes(tool.id));
  }, [pinnedIds]);

  // Danh sách các công cụ dùng gần đây
  const recentTools = useMemo(() => {
    return recentIds
      .map((id) => ALL_TOOLS.find((tool) => tool.id === id))
      .filter((tool): tool is Tool => Boolean(tool));
  }, [recentIds]);

  // Render icon minh hoạ cho từng công cụ
  const renderToolIcon = (iconName: string) => {
    switch (iconName) {
      case 'qr':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        );
      case 'scan':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7V5a2 2 0 012-2h2m12 0h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
          </svg>
        );
      case 'palette':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4 4 4 0 014-4 2 2 0 002-2 4 4 0 014-4 4 4 0 014 4v2a2 2 0 002 2 4 4 0 014 4 4 4 0 01-4 4H7z" />
          </svg>
        );
      case 'image':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'file-text':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'layers':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'shield':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'user':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'link':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      {/* 1. Header & Ô tìm kiếm (Search Bar) */}
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold">
          🚀 Nền tảng tiện ích số Ekila ToolHub
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Khám phá tiện ích & công cụ trực tuyến
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
          Mọi tiện ích bạn cần trong một nền tảng: tạo mã QRCode đa năng, xử lý tệp nhanh chóng và bảo mật tài khoản.
        </p>

        {/* Ô tìm kiếm trung tâm */}
        <div className="pt-2 max-w-xl mx-auto">
          <div className="relative flex items-center">
            <svg
              className="absolute left-4 w-5 h-5 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tiện ích (ví dụ: tạo qr, nén ảnh, pdf, 2fa...)..."
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 p-1 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                aria-label="Xóa tìm kiếm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Bộ lọc theo danh mục nhanh */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            Tất cả ({ALL_TOOLS.length})
          </button>
          {TOOL_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* 2. [FR-COM-06] Tiện ích yêu thích đã ghim lên đầu trang */}
      {pinnedTools.length > 0 && !searchQuery && selectedCategory === 'all' && (
        <section className="space-y-4 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-6 rounded-3xl border border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                ⭐
              </span>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
                Tiện ích đã ghim
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold">
                {pinnedTools.length}
              </span>
            </div>
            <p className="text-xs text-neutral-400 hidden sm:block">
              Tiện ích bạn đánh dấu ưu tiên trên đầu trang
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedTools.map((tool) => (
              <ToolCard
                key={`pinned-${tool.id}`}
                tool={tool}
                isPinned={true}
                onTogglePin={togglePin}
                onClick={handleToolClick}
                renderIcon={renderToolIcon}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. [FR-COM-01] Tiện ích dùng gần đây */}
      {recentTools.length > 0 && !searchQuery && selectedCategory === 'all' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                🕒
              </span>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
                Dùng gần đây
              </h2>
            </div>
            <button
              type="button"
              onClick={clearRecent}
              className="text-xs text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
            >
              Xóa lịch sử
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentTools.map((tool) => (
              <Link
                key={`recent-${tool.id}`}
                href={tool.href}
                onClick={() => handleToolClick(tool.id)}
                className="group p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-500/40 hover:shadow-md transition-all flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  {renderToolIcon(tool.icon)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                    {tool.name}
                  </h3>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {tool.category === 'qr'
                      ? 'QRCode'
                      : tool.category === 'file'
                      ? 'Xử lý tệp'
                      : 'Bảo mật'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 4. [FR-COM-01] Danh sách tiện ích theo Nhóm */}
      <section className="space-y-10">
        {TOOL_CATEGORIES.map((category) => {
          const categoryTools = filteredTools.filter(
            (t) => t.category === category.id
          );

          if (categoryTools.length === 0) return null;

          return (
            <div key={category.id} className="space-y-4">
              <div className="border-b border-neutral-200 dark:border-neutral-800 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                    {category.name}
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {category.description}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                  {categoryTools.length} tiện ích
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {categoryTools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    isPinned={pinnedIds.includes(tool.id)}
                    onTogglePin={togglePin}
                    onClick={handleToolClick}
                    renderIcon={renderToolIcon}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Trạng thái không tìm thấy tiện ích nào */}
        {filteredTools.length === 0 && (
          <div className="text-center py-16 space-y-3 bg-neutral-50 dark:bg-neutral-900/40 rounded-3xl border border-neutral-200 dark:border-neutral-800">
            <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto text-xl">
              🔍
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Không tìm thấy tiện ích nào
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              Không có tiện ích nào khớp với từ khoá &quot;{searchQuery}&quot;. Thử tìm kiếm với từ khoá khác xem sao.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Xóa bộ lọc tìm kiếm
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

// Sub-component thẻ công cụ (ToolCard)
interface ToolCardProps {
  tool: Tool;
  isPinned: boolean;
  onTogglePin: (e: React.MouseEvent, toolId: string) => void;
  onClick: (toolId: string) => void;
  renderIcon: (iconName: string) => React.ReactNode;
}

function ToolCard({
  tool,
  isPinned,
  onTogglePin,
  onClick,
  renderIcon,
}: ToolCardProps) {
  return (
    <Link
      href={tool.href}
      onClick={() => onClick(tool.id)}
      className="group relative p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-500/50 hover:shadow-lg dark:hover:shadow-neutral-900/50 transition-all flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Icon */}
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            {renderIcon(tool.icon)}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Huy hiệu Badge nếu có */}
            {tool.badge && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  tool.badge === 'Mới'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                }`}
              >
                {tool.badge}
              </span>
            )}

            {/* [FR-COM-06] Nút Ghim ⭐ */}
            <button
              type="button"
              onClick={(e) => onTogglePin(e, tool.id)}
              title={isPinned ? 'Bỏ ghim tiện ích' : 'Ghim tiện ích lên đầu'}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isPinned
                  ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                  : 'text-neutral-300 dark:text-neutral-600 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              aria-label={isPinned ? 'Bỏ ghim tiện ích' : 'Ghim tiện ích'}
            >
              <svg
                className="w-4 h-4 fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tiêu đề & mô tả */}
        <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {tool.name}
        </h3>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
          {tool.description}
        </p>
      </div>

      {/* Link hint ở dưới */}
      <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        <span className="font-medium">Mở tiện ích</span>
        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
