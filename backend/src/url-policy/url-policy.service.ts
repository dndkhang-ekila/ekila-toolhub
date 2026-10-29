import { Injectable } from '@nestjs/common';
import { UrlPolicyConfig } from './url-policy.config';
import { matchesDomain, URL_POLICY_VERSION } from './url-policy.domains';
import { UrlPolicyError } from './url-policy.error';
import { UrlPolicyTransport, withAbort } from './url-policy.transport';
import {
  assertPublicUrl,
  hasForbiddenUrlCharacters,
  parsePolicyUrl,
} from './url-policy.url';

export type UrlPolicyApproval = {
  allowed: true;
  normalizedUrl: string;
  hostname: string;
  finalHostname: string;
  redirectsChecked: number;
  policyVersion: string;
};

@Injectable()
export class UrlPolicyService {
  private activeChecks = 0;

  constructor(
    private readonly config: UrlPolicyConfig,
    private readonly transport: UrlPolicyTransport,
  ) {}

  async assertCanShorten(
    input: unknown,
    callerSignal?: AbortSignal,
  ): Promise<UrlPolicyApproval> {
    const original = parsePolicyUrl(input);
    this.assertDestination(original, false);
    if (this.activeChecks >= this.config.maxConcurrentChecks)
      throw new UrlPolicyError('RATE_LIMITED');
    const signal = callerSignal
      ? AbortSignal.any([
          callerSignal,
          AbortSignal.timeout(this.config.timeoutMs),
        ])
      : AbortSignal.timeout(this.config.timeoutMs);
    this.activeChecks++;
    try {
      let current = original;
      const visited = new Set<string>();
      for (let redirects = 0; ; redirects++) {
        this.assertDestination(current, redirects > 0);
        const requestUrl = new URL(current);
        requestUrl.hash = '';
        if (visited.has(requestUrl.href))
          throw new UrlPolicyError('REDIRECT_LOOP');
        visited.add(requestUrl.href);
        let hop;
        try {
          hop = await withAbort(
            this.transport.inspect(requestUrl, signal),
            signal,
          );
        } catch (error) {
          if (error instanceof UrlPolicyError) {
            if (redirects > 0 && error.getStatus() === 422)
              throw new UrlPolicyError(
                'REDIRECT_TARGET_NOT_ALLOWED',
                'UNSAFE_URL_TARGET',
              );
            throw error;
          }
          throw new UrlPolicyError('URL_VERIFICATION_FAILED');
        }
        if ([301, 302, 303, 307, 308].includes(hop.status)) {
          if (!hop.location)
            throw new UrlPolicyError('URL_VERIFICATION_FAILED');
          let next: URL;
          try {
            if (
              hop.location.length > 2048 ||
              hasForbiddenUrlCharacters(hop.location)
            )
              throw new Error('Invalid redirect');
            next = parsePolicyUrl(new URL(hop.location, current).href);
          } catch {
            throw new UrlPolicyError(
              'REDIRECT_TARGET_NOT_ALLOWED',
              'INVALID_URL',
            );
          }
          this.assertDestination(next, true);
          if (redirects >= this.config.maxRedirects)
            throw new UrlPolicyError('TOO_MANY_REDIRECTS');
          current = next;
          continue;
        }
        if (hop.status < 200 || hop.status >= 300)
          throw new UrlPolicyError('URL_VERIFICATION_FAILED');
        return {
          allowed: true,
          normalizedUrl: original.href,
          hostname: original.hostname,
          finalHostname: current.hostname,
          redirectsChecked: redirects,
          policyVersion: URL_POLICY_VERSION,
        };
      }
    } finally {
      this.activeChecks--;
    }
  }

  private assertDestination(url: URL, redirected: boolean) {
    let reason: 'SELF_DOMAIN_NOT_ALLOWED' | 'SHORTENER_DOMAIN_NOT_ALLOWED';
    if (matchesDomain(url.hostname, this.config.toolhubDomains))
      reason = 'SELF_DOMAIN_NOT_ALLOWED';
    else if (matchesDomain(url.hostname, this.config.shortenerDomains))
      reason = 'SHORTENER_DOMAIN_NOT_ALLOWED';
    else {
      try {
        assertPublicUrl(url);
      } catch {
        throw new UrlPolicyError(
          redirected ? 'REDIRECT_TARGET_NOT_ALLOWED' : 'UNSAFE_URL_TARGET',
          redirected ? 'UNSAFE_URL_TARGET' : undefined,
        );
      }
      return;
    }
    throw new UrlPolicyError(
      redirected ? 'REDIRECT_TARGET_NOT_ALLOWED' : reason,
      redirected ? reason : undefined,
    );
  }
}
