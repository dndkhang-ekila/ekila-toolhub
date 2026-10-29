'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  getAllTools,
  getCategories,
  ToolCategory,
  ToolDefinition,
} from '@/lib/tools-registry';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  SearchIcon,
  SparklesIcon,
  ClockIcon,
  QrCodeIcon,
  LinkIcon,
  CameraIcon,
  ImageIcon,
  DocumentIcon,
  CodeIcon,
  LockIcon,
  ArrowRightIcon,
} from '@/components/ui/Icons';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('all');
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);

  const allTools = useMemo(() => getAllTools(), []);
  const categories = useMemo(() => getCategories(), []);

  useEffect(() => {
    const loadRecent = async () => {
      try {
        const stored = localStorage.getItem('toolhub_recent_tools');
        if (stored) {
          setRecentSlugs(JSON.parse(stored));
        }
      } catch {}
    };
    void loadRecent();
  }, []);

  const handleToolClick = (slug: string) => {
    try {
      const updated = [slug, ...recentSlugs.filter((s) => s !== slug)].slice(0, 4);
      setRecentSlugs(updated);
      localStorage.setItem('toolhub_recent_tools', JSON.stringify(updated));
    } catch {}
  };

  const filteredTools = useMemo(() => {
    return allTools.filter((tool) => {
      const matchCategory = activeCategory === 'all' || tool.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        tool.title.toLowerCase().includes(q) ||
        tool.shortDescription.toLowerCase().includes(q) ||
        tool.seo.keywords.some((k) => k.toLowerCase().includes(q));
      return matchCategory && matchSearch;
    });
  }, [allTools, activeCategory, searchQuery]);

  const recentTools = useMemo(() => {
    return recentSlugs
      .map((s) => allTools.find((t) => t.slug === s))
      .filter((t): t is ToolDefinition => Boolean(t));
  }, [recentSlugs, allTools]);

  const renderToolIcon = (iconType: ToolDefinition['iconType']) => {
    switch (iconType) {
      case 'qr':
        return <QrCodeIcon className="h-6 w-6" />;
      case 'link':
        return <LinkIcon className="h-6 w-6" />;
      case 'camera':
        return <CameraIcon className="h-6 w-6" />;
      case 'image':
        return <ImageIcon className="h-6 w-6" />;
      case 'document':
        return <DocumentIcon className="h-6 w-6" />;
      case 'code':
        return <CodeIcon className="h-6 w-6" />;
      case 'lock':
        return <LockIcon className="h-6 w-6" />;
      default:
        return <SparklesIcon className="h-6 w-6" />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors">
      <Header />

      <main className="flex-1 pb-16">
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-indigo-50/40 via-background to-background py-16 sm:py-20 dark:from-indigo-950/20">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-card px-3.5 py-1 text-xs font-semibold text-indigo-700 shadow-sm dark:border-indigo-800/40 dark:text-indigo-300">
              <SparklesIcon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Nền tảng tiện ích online thế hệ mới</span>
            </div>

            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Bộ công cụ đa năng{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                trên trình duyệt
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Tạo mã QR, rút gọn link, nén ảnh, nén PDF và xử lý tài liệu trực tiếp trên thiết bị. Dùng
              ngay tức thì không cần đăng nhập, hoàn toàn miễn phí và bảo mật tuyệt đối.
            </p>

            <div className="mx-auto mt-8 max-w-xl">
              <div className="relative flex items-center">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground">
                  <SearchIcon className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm tiện ích (ví dụ: QR Code, rút gọn link, nén ảnh, PDF...)"
                  className="w-full rounded-2xl border border-input bg-card py-3.5 pl-11 pr-24 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="tools" className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          {recentTools.length > 0 && !searchQuery && activeCategory === 'all' && (
            <div className="mb-10">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <ClockIcon className="h-4 w-4" />
                <span>Dùng gần đây</span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {recentTools.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    onClick={() => handleToolClick(tool.slug)}
                    className="group flex items-center gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${tool.gradient} text-white shadow-sm`}
                    >
                      {renderToolIcon(tool.iconType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-foreground group-hover:text-primary">
                        {tool.title}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {tool.shortDescription}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-4">
            {categories.map((cat) => {
              const count =
                cat.id === 'all' ? allTools.length : allTools.filter((t) => t.category === cat.id).length;
              const isActive = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'border border-border/80 bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-8">
            {filteredTools.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-12 text-center">
                <p className="text-sm font-semibold text-foreground">
                  Không tìm thấy tiện ích nào phù hợp với từ khóa &quot;{searchQuery}&quot;
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Vui lòng thử tìm kiếm bằng từ khóa khác hoặc chuyển sang danh mục khác.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTools.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    onClick={() => handleToolClick(tool.slug)}
                    className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-indigo-500/10"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${tool.gradient} text-white shadow-md transition-transform group-hover:scale-105`}
                        >
                          {renderToolIcon(tool.iconType)}
                        </div>
                      </div>

                      <h2 className="mt-4 text-base font-bold text-foreground transition-colors group-hover:text-primary">
                        {tool.title}
                      </h2>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                        {tool.shortDescription}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4 text-xs font-semibold text-primary">
                      <span>Mở tiện ích</span>
                      <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
