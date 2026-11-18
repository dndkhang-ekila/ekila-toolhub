import { LinkManagement } from '@/components/links/LinkManagement';

export const metadata = {
  title: 'Quản lý liên kết rút gọn | ToolHub',
  description: 'Rút gọn link, gắn tham số UTM chiến dịch và theo dõi thống kê lượt click',
};

export default function LinksPage() {
  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-6">
      <LinkManagement />
    </main>
  );
}

