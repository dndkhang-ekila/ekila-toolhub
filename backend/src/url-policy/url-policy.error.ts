import { HttpException } from '@nestjs/common';

export type UrlPolicyCode =
  | 'INVALID_URL'
  | 'SELF_DOMAIN_NOT_ALLOWED'
  | 'SHORTENER_DOMAIN_NOT_ALLOWED'
  | 'REDIRECT_TARGET_NOT_ALLOWED'
  | 'UNSAFE_URL_TARGET'
  | 'REDIRECT_LOOP'
  | 'TOO_MANY_REDIRECTS'
  | 'URL_VERIFICATION_FAILED'
  | 'RATE_LIMITED';

export class UrlPolicyError extends HttpException {
  constructor(code: UrlPolicyCode, reason?: UrlPolicyCode) {
    super(
      { error: { code, ...(reason ? { reason } : {}) } },
      code === 'RATE_LIMITED'
        ? 429
        : code === 'URL_VERIFICATION_FAILED'
          ? 503
          : code === 'INVALID_URL'
            ? 400
            : 422,
    );
  }
}
