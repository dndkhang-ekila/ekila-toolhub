import React from 'react';
import Link from 'next/link';
import { SparklesIcon, ShieldCheckIcon } from '@/components/ui/Icons';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/40 py-10 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <SparklesIcon className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-foreground">
                Tool<span className="text-primary">Hub</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Nền tảng tiện ích QR Code và bộ công cụ tệp đa năng. Chạy trực tiếp trên trình duyệt,
              nhanh chóng, miễn phí và bảo vệ quyền riêng tư 100%.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <ShieldCheckIcon className="h-3.5 w-3.5 shrink-0" />
              <span>Xử lý tại Client • Không lưu tệp</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Mã QR & Link
            </h3>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/tools/qr-generator" className="hover:text-foreground">
                  Tạo mã QR Code
                </Link>
              </li>
              <li>
                <Link href="/tools/url-shortener" className="hover:text-foreground">
                  Rút gọn liên kết
                </Link>
              </li>
              <li>
                <Link href="/tools/qr-scanner" className="hover:text-foreground">
                  Quét QR & Barcode
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Công cụ tệp
            </h3>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/tools/image-compressor" className="hover:text-foreground">
                  Nén hình ảnh
                </Link>
              </li>
              <li>
                <Link href="/tools/pdf-compressor" className="hover:text-foreground">
                  Nén tài liệu PDF
                </Link>
              </li>
              <li>
                <Link href="/tools/doc-scanner" className="hover:text-foreground">
                  Quét tài liệu sang PDF
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-6 sm:flex-row text-[11px] text-muted-foreground">
          <p>© 2026 ToolHub. Tiện ích trực tuyến đa năng.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-foreground">
              Điều khoản
            </Link>
            <Link href="/" className="hover:text-foreground">
              Bảo mật
            </Link>
            <Link href="/" className="hover:text-foreground">
              Giới thiệu
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
