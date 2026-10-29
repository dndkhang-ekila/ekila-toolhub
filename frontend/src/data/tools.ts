import { Tool, ToolCategoryInfo } from '@/types/tools';

export const TOOL_CATEGORIES: ToolCategoryInfo[] = [
  {
    id: 'qr',
    name: 'Tiện ích QRCode',
    description: 'Tạo, quét và tuỳ biến mã QR chuyên nghiệp đa năng',
    icon: 'QrCodeIcon',
  },
  {
    id: 'file',
    name: 'Công cụ xử lý tệp',
    description: 'Nén ảnh, chuyển đổi PDF và thao tác tài liệu nhanh chóng',
    icon: 'FolderIcon',
  },
  {
    id: 'security',
    name: 'Bảo mật & Tài khoản',
    description: 'Xác thực hai yếu tố, quản lý mật khẩu và hồ sơ bảo mật',
    icon: 'ShieldCheckIcon',
  },
];

export const ALL_TOOLS: Tool[] = [
  // Nhóm tiện ích QR Code
  {
    id: 'qr-generate',
    name: 'Tạo mã QR Code',
    description: 'Tạo mã QR nhanh chóng từ URL, văn bản, WiFi, danh thiếp và email.',
    category: 'qr',
    href: '/qr/generator',
    icon: 'qr',
    badge: 'Phổ biến',
    tags: ['qr', 'tạo qr', 'wifi', 'link', 'url', 'barcode'],
  },
  {
    id: 'qr-scan',
    name: 'Quét mã QR',
    description: 'Quét trực tiếp qua camera thiết bị hoặc tải ảnh lên để nhận diện nội dung.',
    category: 'qr',
    href: '/qr/scanner',
    icon: 'scan',
    tags: ['quét qr', 'đọc mã', 'camera', 'scan'],
  },
  {
    id: 'qr-custom',
    name: 'Tuỳ biến QR nâng cao',
    description: 'Thêm logo thương hiệu, đổ màu gradient nghệ thuật và thiết kế khung viền.',
    category: 'qr',
    href: '/qr/custom',
    icon: 'palette',
    badge: 'Mới',
    tags: ['custom', 'logo', 'màu sắc', 'gradient', 'design'],
  },
  {
    id: 'url-shortener',
    name: 'Rút gọn liên kết (Shortener)',
    description: 'Rút gọn link tức thì, gắn tham số UTM chiến dịch, bật/tắt link và theo dõi lượt click.',
    category: 'qr',
    href: '/links',
    icon: 'link',
    badge: 'Mới',
    tags: ['rút gọn link', 'shortener', 'url', 'utm', 'link ngắn', 'chuyển hướng'],
  },

  // Nhóm xử lý tệp
  {
    id: 'file-compress',
    name: 'Nén & Tối ưu ảnh',
    description: 'Giảm dung lượng ảnh JPG, PNG, WebP mà vẫn giữ trọn vẹn chất lượng sắc nét.',
    category: 'file',
    href: '/files/compress',
    icon: 'image',
    badge: 'Phổ biến',
    tags: ['nén ảnh', 'giảm dung lượng', 'png', 'jpg', 'webp'],
  },
  {
    id: 'file-pdf-convert',
    name: 'Chuyển đổi tệp PDF',
    description: 'Chuyển đổi hai chiều giữa PDF và Word, Excel, PowerPoint hoặc hình ảnh.',
    category: 'file',
    href: '/files/pdf-convert',
    icon: 'file-text',
    tags: ['pdf', 'word', 'chuyển đổi', 'convert', 'tài liệu'],
  },
  {
    id: 'file-pdf-merge',
    name: 'Gộp & Tách tệp PDF',
    description: 'Ghép nhiều file PDF thành một tệp duy nhất hoặc trích xuất từng trang lẻ.',
    category: 'file',
    href: '/files/pdf-merge',
    icon: 'layers',
    tags: ['ghép pdf', 'tách pdf', 'merge', 'split'],
  },

  // Nhóm bảo mật & tài khoản
  {
    id: 'security-2fa',
    name: 'Xác thực 2 lớp (2FA TOTP)',
    description: 'Kích hoạt mã bảo mật 6 số qua Google Authenticator bảo vệ tài khoản an toàn.',
    category: 'security',
    href: '/#2fa-section',
    icon: 'shield',
    badge: 'Mới',
    tags: ['2fa', 'totp', 'bảo mật', 'otp', 'google authenticator'],
  },
  {
    id: 'account-profile',
    name: 'Cài đặt tài khoản & Hồ sơ',
    description: 'Chỉnh sửa thông tin cá nhân, cập nhật avatar, đổi mật khẩu và phiên đăng nhập.',
    category: 'security',
    href: '/account',
    icon: 'user',
    tags: ['hồ sơ', 'đổi mật khẩu', 'cài đặt', 'profile', 'tài khoản'],
  },
];
