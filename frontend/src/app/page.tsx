import { TotpDemoContainer } from '@/components/totp/TotpDemoContainer';

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-10">
      <TotpDemoContainer />
    </main>
  );
}
