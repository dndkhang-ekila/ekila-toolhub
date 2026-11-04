import { BlockList, isIP } from 'node:net';
import { UrlPolicyError } from './url-policy.error';

const blockedV4 = new BlockList();
for (const [address, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  blockedV4.addSubnet(address, prefix, 'ipv4');
}

const globalV6 = new BlockList();
globalV6.addSubnet('2000::', 3, 'ipv6');
const blockedV6 = new BlockList();
blockedV6.addSubnet('2001::', 23, 'ipv6');
blockedV6.addSubnet('2001:db8::', 32, 'ipv6');
blockedV6.addSubnet('2002::', 16, 'ipv6');
blockedV6.addSubnet('3fff::', 20, 'ipv6');

export function networkHostname(url: URL): string {
  return url.hostname.replace(/^\[|\]$/g, '');
}

export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !blockedV4.check(address, 'ipv4');
  if (family === 6)
    return globalV6.check(address, 'ipv6') && !blockedV6.check(address, 'ipv6');
  return false;
}

export function hasForbiddenUrlCharacters(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 32 || code === 127 || character === '\\';
  });
}

export function parsePolicyUrl(input: unknown): URL {
  if (typeof input !== 'string') throw new UrlPolicyError('INVALID_URL');
  const value = input.trim();
  if (
    !value ||
    value.length > 2048 ||
    hasForbiddenUrlCharacters(value) ||
    !/^https?:\/\//i.test(value)
  )
    throw new UrlPolicyError('INVALID_URL');
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new UrlPolicyError('INVALID_URL');
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    !url.hostname ||
    url.username ||
    url.password
  )
    throw new UrlPolicyError('INVALID_URL');
  url.hostname = url.hostname.toLowerCase().replace(/\.+$/, '');
  if (!url.hostname) throw new UrlPolicyError('INVALID_URL');
  return url;
}

export function assertPublicUrl(url: URL): void {
  const hostname = networkHostname(url);
  if (
    url.port ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    (!isIP(hostname) && !hostname.includes('.')) ||
    (isIP(hostname) && !isPublicAddress(hostname))
  )
    throw new UrlPolicyError('UNSAFE_URL_TARGET');
}
