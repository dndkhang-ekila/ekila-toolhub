import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  INTERNAL_BLOCKLIST_DOMAINS,
  IPV4_REGEX,
  IPV6_REGEX,
  KNOWN_SECONDARY_SHORTENERS,
  MALICIOUS_SERVICE_SIGNATURES,
  TOOLHUB_DOMAINS,
} from '../constants/blocklist.constants';
import { SafetyCheckResult } from '../links.types';

@Injectable()
export class UrlSafetyService {
  constructor(private readonly configService: ConfigService) {}

  isDirectIp(hostname: string): boolean {
    const clean = hostname.replace(/^\[|\]$/g, '').trim();
    if (IPV4_REGEX.test(clean)) {
      return true;
    }
    if (IPV6_REGEX.test(clean) || clean.includes(':')) {
      return true;
    }
    return false;
  }

  normalizeHost(hostname: string): string {
    return hostname.trim().toLowerCase().replace(/\.+$/, '');
  }

  matchesDomainList(
    hostname: string,
    domainList: readonly string[],
  ): string | null {
    const target = this.normalizeHost(hostname);
    for (const domain of domainList) {
      const cleanDomain = this.normalizeHost(domain);
      if (!cleanDomain) continue;
      if (target === cleanDomain || target.endsWith(`.${cleanDomain}`)) {
        return cleanDomain;
      }
    }
    return null;
  }

  hasDisallowedChars(val: string): boolean {
    for (let i = 0; i < val.length; i++) {
      const code = val.charCodeAt(i);
      if (code <= 32 || code === 127 || val[i] === '\\') {
        return true;
      }
    }
    return false;
  }

  async checkUrlSafety(rawInput: string): Promise<SafetyCheckResult> {
    const value = (rawInput || '').trim();

    if (!value) {
      return {
        isSafe: false,
        violationKind: 'INVALID_FORMAT',
        reason: 'Vui lòng nhập địa chỉ URL đích cần rút gọn.',
      };
    }

    if (value.length > 2048) {
      return {
        isSafe: false,
        violationKind: 'INVALID_FORMAT',
        reason: 'Địa chỉ URL không được vượt quá 2.048 ký tự.',
      };
    }

    if (this.hasDisallowedChars(value)) {
      return {
        isSafe: false,
        violationKind: 'INVALID_FORMAT',
        reason:
          'Địa chỉ URL chứa khoảng trắng hoặc ký tự điều khiển không hợp lệ.',
      };
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(value);
    } catch {
      return {
        isSafe: false,
        violationKind: 'INVALID_FORMAT',
        reason:
          'Định dạng URL không hợp lệ. Vui lòng nhập URL đầy đủ bắt đầu bằng http:// hoặc https://.',
      };
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return {
        isSafe: false,
        violationKind: 'INVALID_FORMAT',
        reason:
          'Chỉ chấp nhận các liên kết sử dụng giao thức http:// hoặc https://.',
      };
    }

    if (parsedUrl.username || parsedUrl.password) {
      return {
        isSafe: false,
        violationKind: 'INVALID_FORMAT',
        reason: 'Không cho phép liên kết chứa thông tin xác thực đăng nhập.',
      };
    }

    const hostname = this.normalizeHost(parsedUrl.hostname);
    if (!hostname) {
      return {
        isSafe: false,
        violationKind: 'INVALID_FORMAT',
        reason: 'Liên kết chưa có tên miền (hostname) hợp lệ.',
      };
    }

    if (this.isDirectIp(hostname)) {
      return {
        isSafe: false,
        violationKind: 'DIRECT_IP_DISALLOWED',
        reason:
          'Liên kết bị từ chối: Không cho phép rút gọn địa chỉ IP trực tiếp nhằm đảm bảo an toàn mạng.',
        matchedEntry: hostname,
      };
    }

    const matchedToolhub = this.matchesDomainList(hostname, TOOLHUB_DOMAINS);
    if (matchedToolhub) {
      return {
        isSafe: false,
        violationKind: 'TOOLHUB_DOMAIN',
        reason:
          'Không thể rút gọn liên kết trỏ về chính tên miền của hệ thống ToolHub.',
        matchedEntry: matchedToolhub,
      };
    }

    const matchedShortener = this.matchesDomainList(
      hostname,
      KNOWN_SECONDARY_SHORTENERS,
    );
    if (matchedShortener) {
      return {
        isSafe: false,
        violationKind: 'LOOPBACK_SHORTENER',
        reason:
          'Không thể rút gọn liên kết từ một dịch vụ rút gọn khác nhằm tránh nguy cơ chuỗi chuyển hướng độc hại.',
        matchedEntry: matchedShortener,
      };
    }

    const matchedBlocked = this.matchesDomainList(
      hostname,
      INTERNAL_BLOCKLIST_DOMAINS,
    );
    if (matchedBlocked) {
      return {
        isSafe: false,
        violationKind: 'INTERNAL_BLOCKLIST',
        reason:
          'Liên kết bị từ chối: Tên miền đích nằm trong danh sách chặn bảo mật nội bộ của hệ thống (lừa đảo / giả mạo / độc hại).',
        matchedEntry: matchedBlocked,
      };
    }

    const externalApiUrl = this.configService.get<string>(
      'SAFE_BROWSING_API_URL',
    );
    if (externalApiUrl) {
      try {
        const response = await fetch(externalApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: parsedUrl.toString() }),
        });
        if (response.ok) {
          const data = (await response.json()) as {
            isSafe: boolean;
            threatType?: string;
            description?: string;
          };
          if (!data.isSafe) {
            return {
              isSafe: false,
              violationKind:
                data.threatType === 'MALWARE'
                  ? 'MALICIOUS_MALWARE'
                  : 'MALICIOUS_PHISHING',
              reason:
                data.description ||
                'Dịch vụ kiểm tra bảo mật phát hiện URL đích chứa mối đe dọa độc hại.',
            };
          }
        }
      } catch {
        return this.checkOfflineSignatures(parsedUrl.toString(), hostname);
      }
    }

    return this.checkOfflineSignatures(parsedUrl.toString(), hostname);
  }

  private checkOfflineSignatures(
    fullUrl: string,
    hostname: string,
  ): SafetyCheckResult {
    for (const signature of MALICIOUS_SERVICE_SIGNATURES) {
      if (signature.pattern.test(fullUrl)) {
        if (signature.threatType === 'MALWARE') {
          return {
            isSafe: false,
            violationKind: 'MALICIOUS_MALWARE',
            reason:
              'Liên kết bị từ chối: Dịch vụ an ninh cảnh báo trang web chứa mã độc hại hoặc tệp tin nguy hiểm (Malware).',
            threatDetail: signature.description,
          };
        }
        if (signature.threatType === 'SOCIAL_ENGINEERING') {
          return {
            isSafe: false,
            violationKind: 'MALICIOUS_PHISHING',
            reason:
              'Liên kết bị từ chối: Dịch vụ an ninh cảnh báo trang web lừa đảo mạo danh nhằm đánh cắp thông tin (Phishing).',
            threatDetail: signature.description,
          };
        }
        return {
          isSafe: false,
          violationKind: 'MALICIOUS_UNWANTED',
          reason:
            'Liên kết bị từ chối: Dịch vụ an ninh phát hiện trang web chứa phần mềm không mong muốn hoặc hoạt động bất thường.',
          threatDetail: signature.description,
        };
      }
    }

    return {
      isSafe: true,
      normalizedUrl: fullUrl,
      hostname,
    };
  }
}
