import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllTools, getToolBySlug, getToolsByCategory } from '@/lib/tools-registry';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ToolHost } from '@/components/tools/ToolHost';
import {
  SparklesIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  LockIcon,
  ArrowRightIcon,
} from '@/components/ui/Icons';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const tools = getAllTools();
  return tools.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return {
      title: 'Tiện ích không tìm thấy | ToolHub',
      description: 'Tiện ích được yêu cầu không tồn tại hoặc đã được di chuyển.',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolhub.id.vn';
  const canonicalUrl = `${siteUrl}/tools/${tool.slug}`;

  return {
    title: `${tool.seo.title} | ToolHub`,
    description: tool.seo.description,
    keywords: tool.seo.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: tool.seo.title,
      description: tool.seo.description,
      url: canonicalUrl,
      siteName: 'ToolHub',
      locale: 'vi_VN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: tool.seo.title,
      description: tool.seo.description,
    },
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const relatedTools = getToolsByCategory(tool.category)
    .filter((t) => t.slug !== tool.slug)
    .slice(0, 3);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolhub.id.vn';
  const toolUrl = `${siteUrl}/tools/${tool.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: tool.title,
        url: toolUrl,
        description: tool.seo.description,
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'All',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'VND',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Trang chủ',
            item: siteUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Tiện ích',
            item: `${siteUrl}#tools`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: tool.title,
            item: toolUrl,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: tool.seo.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header />

      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Trang chủ
            </Link>
            <span>/</span>
            <Link href="/#tools" className="hover:text-foreground">
              Tiện ích
            </Link>
            <span>/</span>
            <span className="font-medium text-foreground">{tool.title}</span>
          </nav>

          <div className="mb-8 rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {tool.title}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {tool.shortDescription}
                </p>
              </div>

              <Link
                href="/"
                className="inline-flex items-center gap-1.5 self-start rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5" />
                Về danh sách
              </Link>
            </div>

            <div className="mt-8 border-t border-border/60 pt-8">
              <ToolHost tool={tool} />
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-7">
              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                  <SparklesIcon className="h-4 w-4 text-primary" />
                  Tính năng nổi bật
                </h2>
                <ul className="mt-4 space-y-3">
                  {tool.seo.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                      <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-base font-bold text-foreground">Hướng dẫn sử dụng từng bước</h2>
                <ol className="mt-4 space-y-3">
                  {tool.seo.howToUse.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs text-muted-foreground">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[11px] font-bold text-primary">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-base font-bold text-foreground">Câu hỏi thường gặp (FAQ)</h2>
                <div className="mt-4 divide-y divide-border/60">
                  {tool.seo.faqs.map((faq, idx) => (
                    <div key={idx} className="py-3.5 first:pt-0 last:pb-0">
                      <h3 className="text-xs font-semibold text-foreground">{faq.question}</h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-6 lg:col-span-5">
              <div className="rounded-2xl border border-border bg-gradient-to-br from-indigo-50/50 via-card to-card p-6 shadow-sm dark:from-indigo-950/20">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <LockIcon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-foreground">
                  Trải nghiệm đầy đủ tính năng với tài khoản ToolHub
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Bạn có thể dùng ngay không cần đăng nhập. Khi tạo tài khoản miễn phí, bạn sẽ mở khóa
                  tính năng lưu lịch sử, quản lý liên kết rút gọn và nâng hạn mức tệp tin.
                </p>
                <div className="mt-4 flex gap-2">
                  <Link
                    href="/register"
                    className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-95"
                  >
                    Đăng ký miễn phí
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    Đăng nhập
                  </Link>
                </div>
              </div>

              {relatedTools.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tiện ích cùng danh mục
                  </h3>
                  <div className="mt-4 space-y-3">
                    {relatedTools.map((rel) => (
                      <Link
                        key={rel.slug}
                        href={`/tools/${rel.slug}`}
                        className="group flex items-center justify-between rounded-xl border border-border/80 bg-muted/20 p-3 transition-all hover:border-primary/50 hover:bg-muted/40"
                      >
                        <div>
                          <span className="block text-xs font-semibold text-foreground group-hover:text-primary">
                            {rel.title}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground line-clamp-1">
                            {rel.shortDescription}
                          </span>
                        </div>
                        <ArrowRightIcon className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
