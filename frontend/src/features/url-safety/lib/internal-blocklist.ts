export const DEFAULT_INTERNAL_BLOCKLIST_DOMAINS = [
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

export const DEFAULT_KNOWN_SHORTENERS = [
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

export const DEFAULT_TOOLHUB_DOMAINS = [
  'toolhub.id.vn',
  'toolhub.vn',
  'toolhub.example',
  'localhost',
  '127.0.0.1',
] as const;

const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

const IPV6_PATTERN =
  /^\[?(?:[a-fA-F0-9]{1,4}:){1,7}[a-fA-F0-9]{1,4}\]?$/;

export function isDirectIpAddress(hostname: string): boolean {
  const clean = hostname.replace(/^\[|\]$/g, '').trim();
  if (IPV4_PATTERN.test(clean)) {
    return true;
  }
  if (IPV6_PATTERN.test(clean) || clean.includes(':')) {
    return true;
  }
  return false;
}

export function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.+$/, '');
}

export function matchesDomainList(
  hostname: string,
  domainList: readonly string[],
): string | null {
  const normalizedHost = normalizeHostname(hostname);
  for (const domain of domainList) {
    const cleanDomain = normalizeHostname(domain);
    if (!cleanDomain) continue;
    if (
      normalizedHost === cleanDomain ||
      normalizedHost.endsWith(`.${cleanDomain}`)
    ) {
      return cleanDomain;
    }
  }
  return null;
}
