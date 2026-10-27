import { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Đăng ký tài khoản | ToolHub',
  description: 'Tạo tài khoản ToolHub miễn phí để sử dụng các tiện ích QRCode và công cụ tệp.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
