import { AccountSettings } from '@/components/account/AccountSettings';

export const metadata = {
    title: 'Cài đặt tài khoản | ToolHub',
    description: 'Quản lý thông tin hồ sơ, đổi mật khẩu và phiên đăng nhập',
};

export default function AccountPage() {
    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-10">
            <AccountSettings />
        </main>
    );
}
