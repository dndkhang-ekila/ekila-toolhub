import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

@Injectable()
export class TotpCryptoService {
  generateSecret(byteLength = 20): string {
    const buffer = crypto.randomBytes(byteLength);
    return this.encodeBase32(buffer);
  }

  generateOtp(secret: string, counter: number): string {
    const secretBuffer = this.decodeBase32(secret);
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigInt64BE(BigInt(counter));

    const hmac = crypto
      .createHmac('sha1', secretBuffer)
      .update(counterBuffer)
      .digest();

    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = binary % 1_000_000;
    return otp.toString().padStart(6, '0');
  }

  verifyTotp(token: string, secret: string, window = 1): boolean {
    const sanitizedToken = token.trim();
    if (!/^\d{6}$/.test(sanitizedToken)) {
      return false;
    }

    const currentCounter = Math.floor(Date.now() / 1000 / 30);
    const tokenBuffer = Buffer.from(sanitizedToken);

    for (let i = -window; i <= window; i++) {
      const generatedToken = this.generateOtp(secret, currentCounter + i);
      const generatedBuffer = Buffer.from(generatedToken);

      if (
        tokenBuffer.length === generatedBuffer.length &&
        crypto.timingSafeEqual(tokenBuffer, generatedBuffer)
      ) {
        return true;
      }
    }

    return false;
  }

  generateKeyUri(accountName: string, issuer: string, secret: string): string {
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedAccount = encodeURIComponent(accountName);
    return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
  }

  async generateQrCode(otpauthUri: string): Promise<string> {
    return QRCode.toDataURL(otpauthUri, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  }

  generateBackupCodes(count = 8): {
    plainCodes: string[];
    hashedCodes: string[];
  } {
    const plainCodes: string[] = [];
    const hashedCodes: string[] = [];
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let i = 0; i < count; i++) {
      let part1 = '';
      let part2 = '';
      for (let j = 0; j < 4; j++) {
        part1 += chars[crypto.randomInt(0, chars.length)];
        part2 += chars[crypto.randomInt(0, chars.length)];
      }
      const code = `${part1}-${part2}`;
      plainCodes.push(code);
      hashedCodes.push(this.hashBackupCode(code));
    }

    return { plainCodes, hashedCodes };
  }

  hashBackupCode(code: string): string {
    const normalized = code.trim().toUpperCase();
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  encodeBase32(buffer: Buffer): string {
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;

      while (bits >= 5) {
        output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
    }

    return output;
  }

  decodeBase32(base32: string): Buffer {
    const cleaned = base32.toUpperCase().replace(/=+$/, '');
    let bits = 0;
    let value = 0;
    const bytes: number[] = [];

    for (let i = 0; i < cleaned.length; i++) {
      const index = BASE32_ALPHABET.indexOf(cleaned[i]);
      if (index === -1) {
        continue;
      }

      value = (value << 5) | index;
      bits += 5;

      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return Buffer.from(bytes);
  }
}
