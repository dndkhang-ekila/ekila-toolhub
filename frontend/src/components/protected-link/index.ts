/**
 * Module Bảo vệ Link bằng Mật khẩu [FR-URL-10][FE]
 * Bao gồm các component phục vụ thiết lập mật khẩu và màn hình mở khóa liên kết:
 */

// Giao diện thiết lập mật khẩu liên kết (Dành cho Form Rút gọn URL & Quản lý Link)
export { PasswordProtectionOption } from './set-password/PasswordProtectionOption';
export { SetLinkPasswordModal } from './set-password/SetLinkPasswordModal';
export { SetLinkPasswordCard } from './set-password/SetLinkPasswordCard';

// Giao diện khóa & mở khóa liên kết bằng mật khẩu (Dành cho Trang chuyển hướng /s/[slug])
export { ProtectedLinkGate } from './unlock-gate/ProtectedLinkGate';
export { LinkSearchUnlock } from './unlock-gate/LinkSearchUnlock';
