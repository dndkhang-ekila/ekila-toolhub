import * as crypto from 'crypto';

const SECRET_SALT = 'ekila_toolhub_privacy_salt_2026';

export function hashIpWithDailySalt(ip: string): string {
  const today = new Date().toISOString().split('T')[0];
  const rawString = `${ip}_${today}_${SECRET_SALT}`;
  return crypto.createHash('sha256').update(rawString).digest('hex');
}

export function generateRandomSlug(length = 6): string {
  const characters =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += characters.charAt(randomBytes[i] % characters.length);
  }
  return result;
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
  } else if (/chrome|crios/i.test(ua)) {
    browser = 'Chrome';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  } else if (/safari/i.test(ua)) {
    browser = 'Safari';
  } else if (/opera|opr/i.test(ua)) {
    browser = 'Opera';
  }

  return { device, browser };
}
