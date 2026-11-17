import type { Metadata } from 'next';
import { OperationHistoryView } from '@/components/history/OperationHistoryView';

export const metadata: Metadata = {
  title: 'Lịch sử thao tác | ToolHub',
  description: 'Xem lại và quản lý lịch sử liên kết rút gọn, mã QR và tệp tài liệu đã xử lý trên ToolHub.',
};

export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-6 transition-colors">
      <OperationHistoryView />
    </main>
  );
}
