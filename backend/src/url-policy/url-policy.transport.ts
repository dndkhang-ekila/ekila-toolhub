import { Injectable } from '@nestjs/common';
import { lookup } from 'node:dns/promises';
import type { LookupAddress } from 'node:dns';
import * as http from 'node:http';
import * as https from 'node:https';
import { isIP } from 'node:net';
import type { LookupFunction } from 'node:net';
import { UrlPolicyError } from './url-policy.error';
import {
  assertPublicUrl,
  isPublicAddress,
  networkHostname,
} from './url-policy.url';

export type UrlHop = { status: number; location?: string };

export function withAbort<T>(
  operation: Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => {
      signal.removeEventListener('abort', abort);
      reject(new UrlPolicyError('URL_VERIFICATION_FAILED'));
    };
    void operation.then(
      (result) => {
        signal.removeEventListener('abort', abort);
        resolve(result);
      },
      (error: unknown) => {
        signal.removeEventListener('abort', abort);
        reject(
          error instanceof Error
            ? error
            : new UrlPolicyError('URL_VERIFICATION_FAILED'),
        );
      },
    );
    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
  });
}

@Injectable()
export class UrlPolicyTransport {
  async inspect(url: URL, signal: AbortSignal): Promise<UrlHop> {
    if (signal.aborted) throw new UrlPolicyError('URL_VERIFICATION_FAILED');
    assertPublicUrl(url);
    const hostname = networkHostname(url);
    const family = isIP(hostname);
    const addresses: LookupAddress[] = family
      ? [{ address: hostname, family }]
      : await withAbort(
          lookup(hostname, { all: true, verbatim: true }),
          signal,
        );
    if (
      addresses.length === 0 ||
      addresses.some(({ address }) => !isPublicAddress(address))
    )
      throw new UrlPolicyError('UNSAFE_URL_TARGET');
    if (signal.aborted) throw new UrlPolicyError('URL_VERIFICATION_FAILED');
    const pinned = addresses[0];
    const pinnedLookup: LookupFunction = (_hostname, options, callback) => {
      if (options.all) callback(null, [pinned]);
      else callback(null, pinned.address, pinned.family);
    };
    return new Promise((resolve, reject) => {
      const request = (url.protocol === 'https:' ? https : http).request(
        url,
        {
          method: 'GET',
          agent: false,
          lookup: pinnedLookup,
          signal,
          maxHeaderSize: 16384,
          headers: {
            'User-Agent': 'ToolHub-URL-Policy/1.0',
            Accept: '*/*',
            Range: 'bytes=0-0',
            Connection: 'close',
          },
        },
        (response) => {
          resolve({
            status: response.statusCode ?? 0,
            location: response.headers.location,
          });
          response.destroy();
          request.destroy();
        },
      );
      request.on('error', reject);
      request.end();
    });
  }
}
