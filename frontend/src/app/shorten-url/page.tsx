import type { Metadata } from 'next';
import { UrlShortenerContainer } from '@/components/shorten-url/UrlShortenerContainer';

export const metadata: Metadata = {
  title: 'Rút gọn liên kết | ToolHub - Tiện ích QRCode & Công cụ tệp đa năng',
  description:
    'Rút gọn URL trực tuyến an toàn, tốc độ cao dưới 1 giây. Tạo liên kết ngắn với mã slug ngẫu nhiên, tạo mã QR và chia sẻ nhanh chóng.',
};

export default function ShortenUrlPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-neutral-50 dark:bg-neutral-950 transition-colors">
      <UrlShortenerContainer />
    </main>
  );
}
