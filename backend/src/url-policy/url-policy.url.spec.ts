import { ConfigService } from '@nestjs/config';
import { UrlPolicyConfig } from './url-policy.config';
import { isPublicAddress } from './url-policy.url';

describe('URL policy address classification', () => {
  it.each([
    '0.0.0.0',
    '10.0.0.1',
    '100.64.0.1',
    '127.0.0.1',
    '169.254.169.254',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '192.0.0.1',
    '192.0.2.1',
    '192.88.99.1',
    '198.18.0.1',
    '198.51.100.1',
    '203.0.113.1',
    '224.0.0.1',
    '255.255.255.255',
    '::',
    '::1',
    '::ffff:8.8.8.8',
    'fc00::1',
    'fe80::1',
    'ff02::1',
    '64:ff9b::a00:1',
    '2001:db8::1',
    '2001::1',
    '2002:7f00:1::',
    '3fff::1',
    'not-an-address',
  ])('rejects %s', (ip) => expect(isPublicAddress(ip)).toBe(false));

  it.each([
    '8.8.8.8',
    '1.1.1.1',
    '93.184.216.34',
    '2001:4860:4860::8888',
    '2606:4700:4700::1111',
  ])('accepts public %s', (ip) => expect(isPublicAddress(ip)).toBe(true));
});

describe('UrlPolicyConfig', () => {
  it('requires explicit own domains in production', () => {
    expect(
      () => new UrlPolicyConfig(new ConfigService({ NODE_ENV: 'production' })),
    ).toThrow('TOOLHUB_DOMAINS');
  });

  it('normalizes own/extra domains and keeps built-in shorteners', () => {
    const config = new UrlPolicyConfig(
      new ConfigService({
        NODE_ENV: 'production',
        TOOLHUB_DOMAINS: 'TOOLHUB.EXAMPLE.,https://BÜCHER.DE',
        FRONTEND_URL: 'https://app.example',
        URL_POLICY_EXTRA_SHORTENER_DOMAINS: 'short.example,short.example',
      }),
    );
    expect(config.toolhubDomains).toEqual([
      'toolhub.example',
      'xn--bcher-kva.de',
      'app.example',
    ]);
    expect(config.shortenerDomains).toEqual(
      expect.arrayContaining(['bit.ly', 'short.example']),
    );
    expect(
      config.shortenerDomains.filter((domain) => domain === 'short.example'),
    ).toHaveLength(1);
  });

  it.each([
    'https://example.com/path',
    'example.com:8080',
    'example.com?x=1',
    'https://user:pass@example.com',
  ])('rejects invalid domain configuration %s', (domain) => {
    expect(
      () => new UrlPolicyConfig(new ConfigService({ TOOLHUB_DOMAINS: domain })),
    ).toThrow();
  });
});
