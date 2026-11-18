export type ThreatType =
  | 'MALWARE'
  | 'SOCIAL_ENGINEERING'
  | 'UNWANTED_SOFTWARE'
  | 'POTENTIALLY_HARMFUL';

export interface MaliciousThreatMatch {
  threatType: ThreatType;
  platformType: string;
  threatDescription: string;
}

export interface MaliciousServiceResponse {
  isSafe: boolean;
  match?: MaliciousThreatMatch;
}

const KNOWN_MALICIOUS_PATTERNS: Array<{
  pattern: RegExp;
  threatType: ThreatType;
  description: string;
}> = [
  {
    pattern: /malware-test\.com/i,
    threatType: 'MALWARE',
    description: 'Trang web chứa mã độc hại đã được xác nhận (Malware Test Site)',
  },
  {
    pattern: /virus-download\.top/i,
    threatType: 'MALWARE',
    description: 'Nguồn phát tán virus và trojan nguy hiểm',
  },
  {
    pattern: /phishing-bank\.com/i,
    threatType: 'SOCIAL_ENGINEERING',
    description: 'Trang web mạo danh ngân hàng nhằm đánh cắp thông tin đăng nhập (Phishing)',
  },
  {
    pattern: /paypal-login-verify\.info/i,
    threatType: 'SOCIAL_ENGINEERING',
    description: 'Trang lừa đảo mạo danh cổng thanh toán trực tuyến',
  },
  {
    pattern: /adware-bundle-installer\.xyz/i,
    threatType: 'UNWANTED_SOFTWARE',
    description: 'Bộ cài đặt chứa phần mềm quảng cáo và theo dõi không mong muốn',
  },
  {
    pattern: /(?:ransomware|trojan-dropper|payload-delivery)\.(?:biz|cc|ru|top)/i,
    threatType: 'MALWARE',
    description: 'Máy chủ điều khiển và phân phối mã độc tống tiền',
  },
];

export async function checkWithMaliciousUrlService(
  urlToCheck: string,
): Promise<MaliciousServiceResponse> {
  const apiUrl =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SAFE_BROWSING_API_URL
      ? process.env.NEXT_PUBLIC_SAFE_BROWSING_API_URL
      : null;

  if (apiUrl) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToCheck }),
      });
      if (response.ok) {
        const data = (await response.json()) as MaliciousServiceResponse;
        return data;
      }
    } catch {
      return evaluateOfflineThreatDatabase(urlToCheck);
    }
  }

  return evaluateOfflineThreatDatabase(urlToCheck);
}

export function evaluateOfflineThreatDatabase(
  urlToCheck: string,
): MaliciousServiceResponse {
  for (const entry of KNOWN_MALICIOUS_PATTERNS) {
    if (entry.pattern.test(urlToCheck)) {
      return {
        isSafe: false,
        match: {
          threatType: entry.threatType,
          platformType: 'ANY_PLATFORM',
          threatDescription: entry.description,
        },
      };
    }
  }

  return { isSafe: true };
}
