import * as crypto from 'crypto';

export function parseClientIp(
  rawHeader?: string | string[],
  fallback = '127.0.0.1',
): string {
  if (!rawHeader) return fallback;
  const ipStr = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  const first = ipStr.split(',')[0].trim();
  return first || fallback;
}

export function detectDeviceAndBrowser(userAgent: string): {
  device: 'mobile' | 'desktop' | 'tablet' | 'other';
  browser: string;
} {
  const ua = (userAgent || '').toLowerCase();

  let device: 'mobile' | 'desktop' | 'tablet' | 'other' = 'desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    device = 'tablet';
  } else if (
    /mobile|iphone|ipod|android|blackberry|iemobile|kindle/i.test(ua)
  ) {
    device = 'mobile';
  }

  let browser = 'Other';
  if (/edg/i.test(ua)) {
    browser = 'Edge';
  } else if (/opr|opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/chrome|crios/i.test(ua)) {
    browser = 'Chrome';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  } else if (/safari/i.test(ua)) {
    browser = 'Safari';
  }

  return { device, browser };
}

export function hashIpWithDailySalt(ip: string, salt: string): string {
  const today = new Date().toISOString().split('T')[0];
  const rawString = `${ip}_${today}_${salt}`;
  return crypto.createHash('sha256').update(rawString).digest('hex');
}
