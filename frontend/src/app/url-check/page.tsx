import type { Metadata } from "next";
import { UrlPolicyForm } from "@/features/url-policy/components/url-policy-form";

export const metadata: Metadata = {
  title: "Kiểm tra liên kết | ToolHub",
  description:
    "Kiểm tra tên miền ToolHub và dịch vụ rút gọn trước khi tạo link.",
};

export default function UrlCheckPage() {
  return <UrlPolicyForm />;
}
