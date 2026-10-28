import { AccountSettings } from '@/components/account/AccountSettings';
import { TotpDemoContainer } from '@/components/totp/TotpDemoContainer';

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-10 space-y-12">
      <TotpDemoContainer />
      <div className="max-w-4xl mx-auto border-t border-neutral-200 dark:border-neutral-800" />
      <AccountSettings />
    </main>
  );
}
