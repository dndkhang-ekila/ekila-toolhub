import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/password-reset/components/forgot-password-form";

export const metadata: Metadata = { title: null };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
