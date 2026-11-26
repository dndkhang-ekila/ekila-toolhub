import type { Metadata } from 'next';
import { BulkCsvWorkspace } from '@/components/bulk-csv';

export const metadata: Metadata = {
  title: 'Tạo hàng loạt & Xuất CSV | ToolHub',
  description:
    'Tạo liên kết rút gọn hàng loạt từ tệp CSV và xuất danh sách link kèm thống kê lượt nhấp ra CSV.',
};

export default function BulkLinksPage() {
  return <BulkCsvWorkspace />;
}
