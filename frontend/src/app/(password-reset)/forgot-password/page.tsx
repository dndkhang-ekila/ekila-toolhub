import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/password-reset/components/forgot-password-form";

export const metadata: Metadata = { title: "Quên mật khẩu | ToolHub" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
