import { ConfigService } from '@nestjs/config';
import { UrlPolicyConfig } from './url-policy.config';
import { SHORTENER_DOMAINS } from './url-policy.domains';
import { UrlPolicyService } from './url-policy.service';
import type { UrlHop } from './url-policy.transport';

describe('UrlPolicyService', () => {
  let inspect: jest.Mock<Promise<UrlHop>, [URL, AbortSignal]>;
  let policy: UrlPolicyService;
  let config: UrlPolicyConfig;

  beforeEach(() => {
    config = new UrlPolicyConfig(
      new ConfigService({
        TOOLHUB_DOMAINS: 'toolhub.example,go.toolhub.example',
        FRONTEND_URL: 'https://app.toolhub.example',
      }),
    );
    inspect = jest
      .fn<Promise<UrlHop>, [URL, AbortSignal]>()
      .mockResolvedValue({ status: 200 });
    policy = new UrlPolicyService(config, { inspect });
  });

  it.each(SHORTENER_DOMAINS)(
    'blocks %s before any network call',
    async (domain) => {
      await expect(
        policy.assertCanShorten(`https://${domain}/abc`),
      ).rejects.toMatchObject({
        response: { error: { code: 'SHORTENER_DOMAIN_NOT_ALLOWED' } },
      });
      expect(inspect).not.toHaveBeenCalled();
    },
  );

  it.each([
    'https://TOOLHUB.EXAMPLE./abc',
    'https://go.toolhub.example/abc',
    'https://deep.app.toolhub.example/abc',
  ])('blocks own domain and subdomains: %s', async (url) => {
    await expect(policy.assertCanShorten(url)).rejects.toMatchObject({
      response: { error: { code: 'SELF_DOMAIN_NOT_ALLOWED' } },
    });
    expect(inspect).not.toHaveBeenCalled();
  });

  it('blocks normalized shortener subdomains', async () => {
    await expect(
      policy.assertCanShorten('HTTPS://Preview.TinyURL.COM./abc'),
    ).rejects.toMatchObject({
      response: { error: { code: 'SHORTENER_DOMAIN_NOT_ALLOWED' } },
    });
  });

  it.each([
    '',
    null,
    42,
    'bit.ly/abc',
    'https:bit.ly/abc',
    'ftp://example.com/file',
    'javascript:alert(1)',
    'https://user:password@example.com/',
    'https://example.com/a b',
    'https://example.com/\nfile',
    'https://example.com/\\file',
    `https://example.com/${'a'.repeat(2048)}`,
  ])('rejects invalid input %p', async (url) => {
    await expect(policy.assertCanShorten(url)).rejects.toMatchObject({
      response: { error: { code: 'INVALID_URL' } },
    });
    expect(inspect).not.toHaveBeenCalled();
  });

  it.each([
    'https://localhost/',
    'https://server.internal/',
    'https://router.local/',
    'https://intranet/',
    'http://127.1/',
    'http://2130706433/',
    'http://0x7f000001/',
    'http://169.254.169.254/latest/meta-data/',
    'http://10.0.0.1/',
    'http://100.64.0.1/',
    'http://[::1]/',
    'http://[::ffff:127.0.0.1]/',
    'https://example.com:8080/',
  ])('rejects unsafe input %s', async (url) => {
    await expect(policy.assertCanShorten(url)).rejects.toMatchObject({
      response: { error: { code: 'UNSAFE_URL_TARGET' } },
    });
    expect(inspect).not.toHaveBeenCalled();
  });

  it.each([
    'https://bit.ly.example.com/abc',
    'https://nottoolhub.example/abc',
    'https://example.com/bit.ly?next=https://toolhub.example/',
  ])('does not match text outside domain boundary: %s', async (url) => {
    await expect(policy.assertCanShorten(url)).resolves.toMatchObject({
      allowed: true,
      redirectsChecked: 0,
    });
    expect(inspect).toHaveBeenCalledTimes(1);
  });

  it('normalizes IDN, default port, case and whitespace', async () => {
    const result = await policy.assertCanShorten(
      '  HTTPS://BÜCHER.DE:443/a#section  ',
    );
    expect(result).toMatchObject({
      normalizedUrl: 'https://xn--bcher-kva.de/a#section',
      hostname: 'xn--bcher-kva.de',
    });
    expect(inspect.mock.calls[0][0].hash).toBe('');
  });

  it.each([301, 302, 303, 307, 308])(
    'checks HTTP %i redirects',
    async (status) => {
      inspect.mockResolvedValueOnce({ status, location: '/destination' });
      await expect(
        policy.assertCanShorten('https://example.com/start'),
      ).resolves.toMatchObject({
        allowed: true,
        normalizedUrl: 'https://example.com/start',
        redirectsChecked: 1,
      });
      expect(inspect.mock.calls.map(([url]) => url.href)).toEqual([
        'https://example.com/start',
        'https://example.com/destination',
      ]);
    },
  );

  it.each([
    ['https://toolhub.example/abc', 'SELF_DOMAIN_NOT_ALLOWED'],
    ['//bit.ly/abc', 'SHORTENER_DOMAIN_NOT_ALLOWED'],
    ['http://127.0.0.1/', 'UNSAFE_URL_TARGET'],
    ['http://[fd00::1]/', 'UNSAFE_URL_TARGET'],
    ['ftp://example.com/', 'INVALID_URL'],
    ['https://user:pass@example.com/', 'INVALID_URL'],
    ['https://example.com/\tfile', 'INVALID_URL'],
  ])(
    'rejects redirect %s without connecting to its target',
    async (location, reason) => {
      inspect.mockResolvedValueOnce({ status: 302, location });
      await expect(
        policy.assertCanShorten('https://example.com/'),
      ).rejects.toMatchObject({
        response: { error: { code: 'REDIRECT_TARGET_NOT_ALLOWED', reason } },
      });
      expect(inspect).toHaveBeenCalledTimes(1);
    },
  );

  it('rejects an intermediate shortener even if later hops would be allowed', async () => {
    inspect
      .mockResolvedValueOnce({
        status: 302,
        location: 'https://other.example/a',
      })
      .mockResolvedValueOnce({
        status: 302,
        location: 'https://tinyurl.com/abc',
      });
    await expect(
      policy.assertCanShorten('https://example.com/'),
    ).rejects.toMatchObject({
      response: { error: { reason: 'SHORTENER_DOMAIN_NOT_ALLOWED' } },
    });
    expect(inspect).toHaveBeenCalledTimes(2);
  });

  it('detects cycles including fragment-only redirects', async () => {
    inspect.mockResolvedValue({ status: 302, location: '#again' });
    await expect(
      policy.assertCanShorten('https://example.com/'),
    ).rejects.toMatchObject({
      response: { error: { code: 'REDIRECT_LOOP' } },
    });
    expect(inspect).toHaveBeenCalledTimes(1);
  });

  it('allows five redirects and rejects a sixth', async () => {
    inspect.mockImplementation((url) =>
      Promise.resolve({
        status: 302,
        location: `https://example.com/${Number(url.pathname.slice(1)) + 1}`,
      }),
    );
    await expect(
      policy.assertCanShorten('https://example.com/0'),
    ).rejects.toMatchObject({
      response: { error: { code: 'TOO_MANY_REDIRECTS' } },
    });
    expect(inspect).toHaveBeenCalledTimes(6);
    inspect.mockClear();
    inspect.mockImplementation((url) =>
      Promise.resolve(
        url.pathname === '/5'
          ? { status: 204 }
          : { status: 302, location: `/${Number(url.pathname.slice(1)) + 1}` },
      ),
    );
    await expect(
      policy.assertCanShorten('https://example.com/0'),
    ).resolves.toMatchObject({
      redirectsChecked: 5,
    });
  });

  it.each([0, 304, 400, 403, 404, 429, 500])(
    'does not approve final status %i',
    async (status) => {
      inspect.mockResolvedValue({ status });
      await expect(
        policy.assertCanShorten('https://example.com/'),
      ).rejects.toMatchObject({
        response: { error: { code: 'URL_VERIFICATION_FAILED' } },
      });
    },
  );

  it('rejects redirect with missing Location', async () => {
    inspect.mockResolvedValue({ status: 302 });
    await expect(
      policy.assertCanShorten('https://example.com/'),
    ).rejects.toMatchObject({
      response: { error: { code: 'URL_VERIFICATION_FAILED' } },
    });
  });

  it('fails closed on network errors without exposing internals', async () => {
    inspect.mockRejectedValue(new Error('secret network detail'));
    await expect(
      policy.assertCanShorten('https://example.com/'),
    ).rejects.toMatchObject({
      response: { error: { code: 'URL_VERIFICATION_FAILED' } },
    });
  });

  it('enforces a whole-check deadline and releases the concurrency slot', async () => {
    Object.assign(config, { timeoutMs: 20, maxConcurrentChecks: 1 });
    inspect.mockImplementation(() => new Promise(() => {}));
    const pending = policy.assertCanShorten('https://example.com/');
    await expect(
      policy.assertCanShorten('https://example.com/'),
    ).rejects.toMatchObject({
      response: { error: { code: 'RATE_LIMITED' } },
    });
    await expect(pending).rejects.toMatchObject({
      response: { error: { code: 'URL_VERIFICATION_FAILED' } },
    });
    inspect.mockResolvedValue({ status: 200 });
    await expect(
      policy.assertCanShorten('https://example.com/'),
    ).resolves.toMatchObject({ allowed: true });
  });

  it('supports cancellation', async () => {
    const controller = new AbortController();
    inspect.mockImplementation(() => new Promise(() => {}));
    const pending = policy.assertCanShorten(
      'https://example.com/',
      controller.signal,
    );
    controller.abort();
    await expect(pending).rejects.toMatchObject({
      response: { error: { code: 'URL_VERIFICATION_FAILED' } },
    });
  });
});
