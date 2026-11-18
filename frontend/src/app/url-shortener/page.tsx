import type { Metadata } from 'next';
import { UrlShortenerForm } from '@/features/url-safety/components/url-shortener-form';

export const metadata: Metadata = {
  title: 'Rút gọn link & Kiểm tra an toàn URL | ToolHub',
  description:
    'Tiện ích rút gọn liên kết tốc độ cao, tự động đối chiếu URL đích với danh sách chặn nội bộ và dịch vụ kiểm tra mã độc độc hại trước khi tạo.',
};

export default function UrlShortenerPage() {
  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <span>Tiện ích M01</span>
            <span>•</span>
            <span>FR-URL-03 An toàn bảo mật</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Rút gọn liên kết & Kiểm tra URL độc hại
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Tạo liên kết rút gọn kèm mã QR tức thì. Mọi URL đích đều được đối chiếu với danh sách chặn nội bộ và dịch vụ bảo mật trước khi khởi tạo.
          </p>
        </div>

        <UrlShortenerForm />
      </div>
    </div>
  );
}
