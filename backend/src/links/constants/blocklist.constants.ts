export const INTERNAL_BLOCKLIST_DOMAINS = [
  'phishing-bank-login.com',
  'free-nitro-scam.xyz',
  'darkweb-market.cc',
  'account-verify-fake.com',
  'malware-drop.site',
  'login-security-update.net',
  'paypal-security-alert.xyz',
  'steampromos-free.ru',
  'free-giftcards-claim.top',
  'apple-id-verify.click',
  'bank-secure-login.info',
  'crypto-drainer-auth.site',
  'evil-payload.ru',
  'facebook-verify-badge.online',
  'google-security-notice.biz',
] as const;

export const KNOWN_SECONDARY_SHORTENERS = [
  'bit.ly',
  'tinyurl.com',
  't.co',
  'cutt.ly',
  'is.gd',
  'buff.ly',
  'rebrand.ly',
  'shorturl.at',
  'goo.gl',
  'ow.ly',
] as const;

export const TOOLHUB_DOMAINS = [
  'toolhub.id.vn',
  'toolhub.vn',
  'toolhub.example',
  'localhost',
  '127.0.0.1',
] as const;

export const IPV4_REGEX =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export const IPV6_REGEX = /^\[?(?:[a-fA-F0-9]{1,4}:){1,7}[a-fA-F0-9]{1,4}\]?$/;

export const MALICIOUS_SERVICE_SIGNATURES: Array<{
  pattern: RegExp;
  threatType: 'MALWARE' | 'SOCIAL_ENGINEERING' | 'UNWANTED_SOFTWARE';
  description: string;
}> = [
  {
    pattern: /malware-test\.com/i,
    threatType: 'MALWARE',
    description:
      'Trang web chứa mã độc hại đã được xác nhận (Malware Test Site)',
  },
  {
    pattern: /virus-download\.top/i,
    threatType: 'MALWARE',
    description: 'Nguồn phát tán virus và trojan nguy hiểm',
  },
  {
    pattern: /phishing-bank\.com/i,
    threatType: 'SOCIAL_ENGINEERING',
    description:
      'Trang web mạo danh ngân hàng nhằm đánh cắp thông tin (Phishing)',
  },
  {
    pattern: /paypal-login-verify\.info/i,
    threatType: 'SOCIAL_ENGINEERING',
    description: 'Trang lừa đảo mạo danh cổng thanh toán trực tuyến',
  },
  {
    pattern: /adware-bundle-installer\.xyz/i,
    threatType: 'UNWANTED_SOFTWARE',
    description:
      'Bộ cài đặt chứa phần mềm quảng cáo và theo dõi không mong muốn',
  },
  {
    pattern:
      /(?:ransomware|trojan-dropper|payload-delivery)\.(?:biz|cc|ru|top)/i,
    threatType: 'MALWARE',
    description: 'Máy chủ điều khiển và phân phối mã độc tống tiền',
  },
];
