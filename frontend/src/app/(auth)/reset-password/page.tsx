import type { Metadata } from "next";
import { Suspense } from "react";
import {
  CheckingResetLink,
  ResetPasswordForm,
} from "@/features/password-reset/components/reset-password-form";

export const metadata: Metadata = { title: "Đặt lại mật khẩu | ToolHub" };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<CheckingResetLink />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
