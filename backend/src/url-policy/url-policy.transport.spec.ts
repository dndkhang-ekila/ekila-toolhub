import { lookup } from 'node:dns/promises';
import type { LookupAddress, LookupAllOptions } from 'node:dns';
import { EventEmitter } from 'node:events';
import * as http from 'node:http';
import * as https from 'node:https';
import type { LookupFunction } from 'node:net';
import { UrlPolicyError } from './url-policy.error';
import { UrlPolicyTransport } from './url-policy.transport';

jest.mock('node:dns/promises', () => ({ lookup: jest.fn() }));
jest.mock('node:http', () => ({ request: jest.fn() }));
jest.mock('node:https', () => ({ request: jest.fn() }));

describe('UrlPolicyTransport', () => {
  const resolveDns = jest.mocked(lookup) as unknown as jest.MockedFunction<
    (hostname: string, options: LookupAllOptions) => Promise<LookupAddress[]>
  >;
  let transport: UrlPolicyTransport;
  let request: EventEmitter & { end: jest.Mock; destroy: jest.Mock };
  let options: https.RequestOptions;
  let requestedUrl: URL;
  let destroyResponse: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    transport = new UrlPolicyTransport();
    resolveDns.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    destroyResponse = jest.fn();
    request = Object.assign(new EventEmitter(), {
      end: jest.fn(),
      destroy: jest.fn(),
    });
    const implementation = (...args: unknown[]) => {
      requestedUrl = args[0] as URL;
      options = args[1] as https.RequestOptions;
      const onResponse = args[2] as (response: http.IncomingMessage) => void;
      request.end.mockImplementation(() =>
        onResponse({
          statusCode: 302,
          headers: { location: '/target' },
          destroy: destroyResponse,
        } as unknown as http.IncomingMessage),
      );
      return request as unknown as http.ClientRequest;
    };
    jest.mocked(http.request).mockImplementation(implementation);
    jest.mocked(https.request).mockImplementation(implementation);
  });

  it('pins validated DNS while preserving hostname and TLS defaults', async () => {
    const signal = new AbortController().signal;
    await expect(
      transport.inspect(new URL('https://example.com/path'), signal),
    ).resolves.toEqual({
      status: 302,
      location: '/target',
    });
    expect(requestedUrl.hostname).toBe('example.com');
    expect(resolveDns).toHaveBeenCalledTimes(1);
    expect(options).toMatchObject({
      method: 'GET',
      agent: false,
      signal,
      maxHeaderSize: 16384,
      headers: { Range: 'bytes=0-0' },
    });
    expect(options.rejectUnauthorized).not.toBe(false);
    expect(options.headers).not.toHaveProperty('Authorization');
    expect(options.headers).not.toHaveProperty('Cookie');
    const pinned = options.lookup as LookupFunction;
    const callback = jest.fn();
    pinned('example.com', { all: false }, callback);
    expect(callback).toHaveBeenCalledWith(null, '93.184.216.34', 4);
    callback.mockClear();
    pinned('example.com', { all: true }, callback);
    expect(callback).toHaveBeenCalledWith(null, [
      { address: '93.184.216.34', family: 4 },
    ]);
    expect(resolveDns).toHaveBeenCalledTimes(1);
    expect(destroyResponse).toHaveBeenCalledTimes(1);
    expect(request.destroy).toHaveBeenCalledTimes(1);
    expect(http.request).not.toHaveBeenCalled();
  });

  it.each([
    [{ address: '10.0.0.1', family: 4 }],
    [
      { address: '93.184.216.34', family: 4 },
      { address: '127.0.0.1', family: 4 },
    ],
    [{ address: '::ffff:127.0.0.1', family: 6 }],
    [],
  ])(
    'rejects unsafe or empty DNS answer %p before connecting',
    async (...addresses) => {
      resolveDns.mockResolvedValue(addresses);
      await expect(
        transport.inspect(
          new URL('https://example.com/'),
          new AbortController().signal,
        ),
      ).rejects.toMatchObject({
        response: { error: { code: 'UNSAFE_URL_TARGET' } },
      });
      expect(http.request).not.toHaveBeenCalled();
      expect(https.request).not.toHaveBeenCalled();
    },
  );

  it('skips DNS for a public literal IPv6 address', async () => {
    await transport.inspect(
      new URL('http://[2606:4700:4700::1111]/'),
      new AbortController().signal,
    );
    expect(resolveDns).not.toHaveBeenCalled();
    expect(http.request).toHaveBeenCalledTimes(1);
  });

  it('does not connect on DNS errors', async () => {
    resolveDns.mockRejectedValue(new Error('ENOTFOUND'));
    await expect(
      transport.inspect(
        new URL('https://example.com/'),
        new AbortController().signal,
      ),
    ).rejects.toThrow('ENOTFOUND');
    expect(https.request).not.toHaveBeenCalled();
  });

  it('does not resolve or connect when already cancelled', async () => {
    const cancellation = new AbortController();
    cancellation.abort();
    await expect(
      transport.inspect(new URL('https://example.com/'), cancellation.signal),
    ).rejects.toBeInstanceOf(UrlPolicyError);
    expect(resolveDns).not.toHaveBeenCalled();
    expect(https.request).not.toHaveBeenCalled();
  });

  it('stops waiting for DNS when cancelled and never opens a socket afterward', async () => {
    let resolvePending: (
      addresses: { address: string; family: number }[],
    ) => void = () => {};
    resolveDns.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePending = resolve;
        }),
    );
    const cancellation = new AbortController();
    const pending = transport.inspect(
      new URL('https://example.com/'),
      cancellation.signal,
    );
    cancellation.abort();
    await expect(pending).rejects.toBeInstanceOf(UrlPolicyError);
    resolvePending([{ address: '93.184.216.34', family: 4 }]);
    await Promise.resolve();
    expect(https.request).not.toHaveBeenCalled();
  });
});
