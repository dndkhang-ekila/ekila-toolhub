import QRCode from 'qrcode';
import { TotpSetupData } from '@/types/totp';

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateBase32Secret(length = 16): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * BASE32_CHARS.length);
    result += BASE32_CHARS[randomIndex];
  }
  return result;
}

export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < count; i++) {
    let part1 = '';
    let part2 = '';
    for (let j = 0; j < 4; j++) {
      part1 += chars[Math.floor(Math.random() * chars.length)];
      part2 += chars[Math.floor(Math.random() * chars.length)];
    }
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

export async function createMockTotpSetup(
  accountName = 'user@ekila.vn',
  issuer = 'ToolHub',
): Promise<TotpSetupData> {
  const secret = generateBase32Secret(16);
  const otpauthUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

  const qrCodeUrl = await QRCode.toDataURL(otpauthUri, {
    width: 240,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });

  const backupCodes = generateBackupCodes(8);

  return {
    secret,
    qrCodeUrl,
    otpauthUri,
    accountName,
    issuer,
    backupCodes,
  };
}

export function downloadBackupCodesFile(codes: string[], accountName: string): void {
  const content = `ToolHub - Mã dự phòng xác thực hai lớp (2FA Backup Codes)\nTài khoản: ${accountName}\nNgày tạo: ${new Date().toLocaleString('vi-VN')}\n\nLưu ý: Mỗi mã chỉ có thể sử dụng 1 lần duy nhất khi bạn không truy cập được ứng dụng Authenticator.\n\n` +
    codes.map((c, i) => `${i + 1}. ${c}`).join('\n') +
    '\n\nBảo quản mã này ở nơi an toàn!';

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `toolhub-2fa-backup-codes-${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
