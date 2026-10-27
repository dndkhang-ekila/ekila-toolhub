import type { Metadata } from "next";
import { AuthShell } from "@/features/password-reset/components/auth-shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthShell>{children}</AuthShell>;
}
