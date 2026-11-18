import {
  DEFAULT_INTERNAL_BLOCKLIST_DOMAINS,
  DEFAULT_KNOWN_SHORTENERS,
  DEFAULT_TOOLHUB_DOMAINS,
  isDirectIpAddress,
  matchesDomainList,
  normalizeHostname,
} from './internal-blocklist';
import { checkWithMaliciousUrlService } from './malicious-url-service';
import type { UrlSafetyCheckResult } from '../types/url-safety.types';

export interface SafetyCheckOptions {
  customBlocklist?: readonly string[];
  customToolhubDomains?: readonly string[];
  customShorteners?: readonly string[];
}

export async function checkUrlSafety(
  rawInput: string,
  options: SafetyCheckOptions = {},
): Promise<UrlSafetyCheckResult> {
  const value = rawInput.trim();

  if (!value) {
    return {
      ok: false,
      kind: 'INVALID_FORMAT',
      reason: 'Vui lòng nhập địa chỉ URL đích cần rút gọn.',
    };
  }

  if (value.length > 2048) {
    return {
      ok: false,
      kind: 'INVALID_FORMAT',
      reason: 'Địa chỉ URL không được vượt quá 2.048 ký tự.',
    };
  }

  if (/[\u0000-\u0020\u007f\\]/.test(value)) {
    return {
      ok: false,
      kind: 'INVALID_FORMAT',
      reason: 'Địa chỉ URL chứa khoảng trắng hoặc ký tự điều khiển không hợp lệ.',
    };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(value);
  } catch {
    return {
      ok: false,
      kind: 'INVALID_FORMAT',
      reason:
        'Vui lòng nhập URL đầy đủ bắt đầu bằng http:// hoặc https:// (ví dụ: https://example.com).',
    };
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return {
      ok: false,
      kind: 'INVALID_FORMAT',
      reason:
        'Chỉ hỗ trợ giao thức liên kết http:// hoặc https:// an toàn.',
    };
  }

  if (parsedUrl.username || parsedUrl.password) {
    return {
      ok: false,
      kind: 'INVALID_FORMAT',
      reason:
        'Không được sử dụng liên kết chứa thông tin xác thực đăng nhập.',
    };
  }

  const hostname = normalizeHostname(parsedUrl.hostname);
  if (!hostname) {
    return {
      ok: false,
      kind: 'INVALID_FORMAT',
      reason: 'Liên kết chưa có tên miền (hostname) hợp lệ.',
    };
  }

  if (isDirectIpAddress(hostname)) {
    return {
      ok: false,
      kind: 'DIRECT_IP_DISALLOWED',
      reason:
        'Liên kết bị từ chối: Không cho phép rút gọn địa chỉ IP trực tiếp nhằm ngăn ngừa rủi ro bảo mật mạng.',
      matchedEntry: hostname,
    };
  }

  const toolhubDomains =
    options.customToolhubDomains ?? DEFAULT_TOOLHUB_DOMAINS;
  const matchedToolhub = matchesDomainList(hostname, toolhubDomains);
  if (matchedToolhub) {
    return {
      ok: false,
      kind: 'TOOLHUB_DOMAIN',
      reason:
        'Không thể rút gọn liên kết trỏ về chính tên miền của hệ thống ToolHub.',
      matchedEntry: matchedToolhub,
    };
  }

  const shortenerDomains =
    options.customShorteners ?? DEFAULT_KNOWN_SHORTENERS;
  const matchedShortener = matchesDomainList(hostname, shortenerDomains);
  if (matchedShortener) {
    return {
      ok: false,
      kind: 'LOOPBACK_SHORTENER',
      reason:
        'Không thể rút gọn liên kết từ một dịch vụ rút gọn khác nhằm ngăn ngừa nguy cơ chuỗi chuyển hướng độc hại.',
      matchedEntry: matchedShortener,
    };
  }

  const blocklistDomains =
    options.customBlocklist ?? DEFAULT_INTERNAL_BLOCKLIST_DOMAINS;
  const matchedBlocked = matchesDomainList(hostname, blocklistDomains);
  if (matchedBlocked) {
    return {
      ok: false,
      kind: 'INTERNAL_BLOCKLIST',
      reason:
        'Liên kết bị từ chối: Tên miền đích nằm trong danh sách chặn bảo mật nội bộ của hệ thống (lừa đảo / giả mạo / độc hại).',
      matchedEntry: matchedBlocked,
    };
  }

  const maliciousCheck = await checkWithMaliciousUrlService(
    parsedUrl.toString(),
  );
  if (!maliciousCheck.isSafe && maliciousCheck.match) {
    const { threatType, threatDescription } = maliciousCheck.match;
    if (threatType === 'MALWARE') {
      return {
        ok: false,
        kind: 'MALICIOUS_MALWARE',
        reason:
          'Liên kết bị từ chối: Dịch vụ an ninh cảnh báo trang web chứa mã độc hại hoặc tệp tin nguy hiểm (Malware).',
        threatDetail: threatDescription,
      };
    }
    if (threatType === 'SOCIAL_ENGINEERING') {
      return {
        ok: false,
        kind: 'MALICIOUS_PHISHING',
        reason:
          'Liên kết bị từ chối: Dịch vụ an ninh cảnh báo trang web lừa đảo mạo danh nhằm đánh cắp thông tin (Phishing).',
        threatDetail: threatDescription,
      };
    }
    return {
      ok: false,
      kind: 'MALICIOUS_UNWANTED',
      reason:
        'Liên kết bị từ chối: Dịch vụ an ninh phát hiện trang web chứa phần mềm độc hại hoặc hoạt động bất thường.',
      threatDetail: threatDescription,
    };
  }

  return {
    ok: true,
    normalizedUrl: parsedUrl.toString(),
    hostname,
  };
}
