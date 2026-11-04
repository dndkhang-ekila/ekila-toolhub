import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SHORTENER_DOMAINS } from './url-policy.domains';
import { parsePolicyUrl } from './url-policy.url';

function domains(value: string): string[] {
  return value
    .split(',')
    .filter(Boolean)
    .map((entry) => {
      const input = entry.trim();
      const url = parsePolicyUrl(
        input.includes('://') ? input : `https://${input}`,
      );
      if (url.pathname !== '/' || url.search || url.hash || url.port)
        throw new Error('URL policy domains must contain hostnames only');
      return url.hostname;
    });
}

@Injectable()
export class UrlPolicyConfig {
  readonly toolhubDomains: readonly string[];
  readonly shortenerDomains: readonly string[];
  readonly maxRedirects = 5;
  readonly timeoutMs = 5000;
  readonly maxConcurrentChecks = 16;

  constructor(config: ConfigService) {
    const own = config.get<string>('TOOLHUB_DOMAINS', '');
    if (config.get<string>('NODE_ENV') === 'production' && !own.trim())
      throw new Error('TOOLHUB_DOMAINS is required in production');
    const frontend = parsePolicyUrl(
      config.get<string>('FRONTEND_URL', 'http://localhost:3000'),
    );
    this.toolhubDomains = [...new Set([...domains(own), frontend.hostname])];
    this.shortenerDomains = [
      ...new Set([
        ...SHORTENER_DOMAINS,
        ...domains(
          config.get<string>('URL_POLICY_EXTRA_SHORTENER_DOMAINS', ''),
        ),
      ]),
    ];
  }
}
