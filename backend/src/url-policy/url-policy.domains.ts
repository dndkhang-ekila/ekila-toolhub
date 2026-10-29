export const SHORTENER_DOMAINS = [
  'bit.ly',
  'tinyurl.com',
  'cutt.ly',
  'rebrand.ly',
  'rb.gy',
  't.co',
  'buff.ly',
  'ow.ly',
  'is.gd',
  'v.gd',
  'tiny.cc',
  't.ly',
  'shorturl.at',
  's.gy',
  'dub.sh',
  'd.to',
] as const;

export const URL_POLICY_VERSION = '2026-10-29.1';

export function matchesDomain(hostname: string, domains: readonly string[]) {
  return domains.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );
}
