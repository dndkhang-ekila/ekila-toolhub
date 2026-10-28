import { HomeTools } from '@/components/home/HomeTools';
import { TotpDemoContainer } from '@/components/totp/TotpDemoContainer';

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-6">
      <HomeTools />

      <div
        id="2fa-section"
        className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 border-t border-neutral-200 dark:border-neutral-800"
      >
        <div className="mb-6">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Khu vực demo: Xác thực 2 lớp (2FA TOTP)
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Tính năng mẫu bảo mật của nhóm
          </p>
        </div>
        <TotpDemoContainer />
      </div>
    </main>
  );
}
